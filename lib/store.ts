import {
  getPublicItems as dbGetPublicItems,
  getAdminItems as dbGetAdminItems,
  getCatalogStats as dbGetCatalogStats,
} from "./items";
import { createClaim as dbCreateClaim } from "./claims";
import { placeBid as dbPlaceBid } from "./bids";
import { getDb } from "./db";
import { items } from "./schema";
import { eq } from "drizzle-orm";
import {
  isDevStoreMode,
  devGetPublicItems,
  devGetAdminItems,
  devGetCatalogStats,
  devCreateClaim,
  devMarkSold,
  devUpdatePrice,
  devAddItem,
  devPlaceBid,
} from "./dev-store";
import type { SaleItemPublic, SaleItemAdmin, ClaimResult, BidResult } from "./types";

export async function getCatalogStats(): Promise<{
  available: number;
  total: number;
}> {
  if (isDevStoreMode()) return devGetCatalogStats();
  return dbGetCatalogStats();
}

export async function getPublicItems(): Promise<SaleItemPublic[]> {
  if (isDevStoreMode()) return devGetPublicItems();
  return dbGetPublicItems();
}

export async function getAdminItems(): Promise<SaleItemAdmin[]> {
  if (isDevStoreMode()) return devGetAdminItems();
  return dbGetAdminItems();
}

export async function createClaim(
  itemId: number,
  claimerName: string
): Promise<ClaimResult> {
  if (isDevStoreMode()) return devCreateClaim(itemId, claimerName);
  return dbCreateClaim(itemId, claimerName);
}

export async function markItemSold(itemId: number) {
  if (isDevStoreMode()) {
    devMarkSold(itemId);
    return;
  }
  const db = getDb();
  await db
    .update(items)
    .set({ status: "claimed" })
    .where(eq(items.id, itemId));
}

export async function updateItemPrice(itemId: number, price: number) {
  if (isDevStoreMode()) {
    devUpdatePrice(itemId, price);
    return;
  }
  const db = getDb();
  await db.update(items).set({ price }).where(eq(items.id, itemId));
}

export async function placeBid(data: {
  itemId: number;
  amount: number;
  bidderName: string;
  bidderEmail: string;
  bidderId: string;
}): Promise<BidResult> {
  if (isDevStoreMode()) return devPlaceBid(data);
  return dbPlaceBid(data);
}

export async function addItem(data: {
  name: string;
  price: number;
  category: string;
  description: string;
  imagePaths: string[];
}) {
  if (isDevStoreMode()) return devAddItem(data);
  const db = getDb();
  const maxOrder = await db.select().from(items);
  const sortOrder =
    maxOrder.length > 0
      ? Math.max(...maxOrder.map((i) => i.sortOrder)) + 1
      : 1;
  const [row] = await db
    .insert(items)
    .values({
      name: data.name,
      price: data.price,
      category: data.category,
      description: data.description,
      imagePaths: data.imagePaths,
      status: "available",
      queueCount: 0,
      sortOrder,
    })
    .returning();
  return row.id;
}
