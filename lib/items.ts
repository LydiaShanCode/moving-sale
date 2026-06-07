import { eq, asc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { items, claims } from "./schema";
import { getAllBidStats, getTopBidders, startingBidFor } from "./bids";
import {
  isDevStoreMode,
  devGetAllBidStats,
  devGetTopBidders,
} from "./dev-store";
import type { SaleItemPublic, SaleItemAdmin } from "./types";

export function toPublicItem(
  row: {
    id: number;
    name: string;
    price: number;
    category: string;
    description: string;
    status: string;
    imagePaths: string[];
    queueCount: number;
  },
  bidStats?: { currentBid: number | null; bidCount: number }
): SaleItemPublic {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    startingBid: startingBidFor(row.price),
    currentBid: bidStats?.currentBid ?? null,
    bidCount: bidStats?.bidCount ?? 0,
    category: row.category,
    description: row.description,
    status: row.status as SaleItemPublic["status"],
    images: row.imagePaths,
    queue: row.queueCount,
  };
}

export async function getCatalogStats(): Promise<{
  available: number;
  total: number;
}> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      available: sql<number>`count(*) filter (where ${items.status} = 'available')::int`,
    })
    .from(items);
  return {
    total: row?.total ?? 0,
    available: row?.available ?? 0,
  };
}

export async function getPublicItems(): Promise<SaleItemPublic[]> {
  const db = getDb();
  const [rows, bidStats] = await Promise.all([
    db
      .select()
      .from(items)
      .where(eq(items.status, "available"))
      .orderBy(asc(items.sortOrder), asc(items.id)),
    isDevStoreMode() ? Promise.resolve(devGetAllBidStats()) : getAllBidStats(),
  ]);
  return rows.map((row) => toPublicItem(row, bidStats.get(row.id)));
}

export async function getAdminItems(): Promise<SaleItemAdmin[]> {
  const db = getDb();
  const [rows, allClaims, bidStats, topBidders] = await Promise.all([
    db.select().from(items).orderBy(asc(items.sortOrder), asc(items.id)),
    db.select().from(claims),
    isDevStoreMode() ? Promise.resolve(devGetAllBidStats()) : getAllBidStats(),
    isDevStoreMode() ? Promise.resolve(devGetTopBidders()) : getTopBidders(),
  ]);

  const firstClaimByItem = new Map<number, string>();
  for (const c of allClaims) {
    if (c.position === 1 && !firstClaimByItem.has(c.itemId)) {
      firstClaimByItem.set(c.itemId, c.claimerName);
    }
  }

  return rows.map((row) => ({
    ...toPublicItem(row, bidStats.get(row.id)),
    claimerName: firstClaimByItem.get(row.id) ?? null,
    topBidder: topBidders.get(row.id) ?? null,
  }));
}
