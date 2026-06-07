import { eq, max, count, sql } from "drizzle-orm";
import { getDb } from "./db";
import { bids, items } from "./schema";
import { AUCTION_END, STARTING_BID_MULTIPLIER } from "./site";

export function startingBidFor(price: number): number {
  return Math.round(price * STARTING_BID_MULTIPLIER);
}

export function isAuctionOpen(): boolean {
  return Date.now() < AUCTION_END.getTime();
}

export async function getBidStats(
  itemId: number
): Promise<{ currentBid: number | null; bidCount: number }> {
  const db = getDb();
  const [row] = await db
    .select({
      currentBid: max(bids.amount),
      bidCount: count(bids.id),
    })
    .from(bids)
    .where(eq(bids.itemId, itemId));
  return {
    currentBid: row?.currentBid ?? null,
    bidCount: row?.bidCount ?? 0,
  };
}

export async function getAllBidStats(): Promise<
  Map<number, { currentBid: number | null; bidCount: number }>
> {
  const db = getDb();
  const rows = await db
    .select({
      itemId: bids.itemId,
      currentBid: max(bids.amount),
      bidCount: sql<number>`count(${bids.id})::int`,
    })
    .from(bids)
    .groupBy(bids.itemId);

  const map = new Map<number, { currentBid: number | null; bidCount: number }>();
  for (const row of rows) {
    map.set(row.itemId, {
      currentBid: row.currentBid ?? null,
      bidCount: row.bidCount,
    });
  }
  return map;
}

export async function getTopBidders(): Promise<
  Map<number, { name: string; email: string; amount: number }>
> {
  const db = getDb();
  const rows = await db
    .select({
      itemId: bids.itemId,
      bidderName: bids.bidderName,
      bidderEmail: bids.bidderEmail,
      amount: bids.amount,
    })
    .from(bids)
    .orderBy(bids.amount);

  const map = new Map<number, { name: string; email: string; amount: number }>();
  for (const row of rows) {
    const existing = map.get(row.itemId);
    if (!existing || row.amount > existing.amount) {
      map.set(row.itemId, {
        name: row.bidderName,
        email: row.bidderEmail,
        amount: row.amount,
      });
    }
  }
  return map;
}

export async function placeBid(data: {
  itemId: number;
  amount: number;
  bidderName: string;
  bidderEmail: string;
  bidderId: string;
}): Promise<{ ok: boolean; newBid: number }> {
  if (!isAuctionOpen()) {
    throw new Error("Auction has ended");
  }

  const db = getDb();

  const [item] = await db
    .select({ price: items.price, status: items.status })
    .from(items)
    .where(eq(items.id, data.itemId));

  if (!item) throw new Error("Item not found");
  if (item.status === "claimed") throw new Error("Item is no longer available");

  const starting = startingBidFor(item.price);
  const { currentBid } = await getBidStats(data.itemId);
  const minBid = currentBid !== null ? currentBid + 1 : starting;

  if (data.amount < minBid) {
    throw new Error(
      currentBid !== null
        ? `Bid must be above $${currentBid}`
        : `Minimum bid is $${starting}`
    );
  }

  await db.insert(bids).values({
    itemId: data.itemId,
    amount: data.amount,
    bidderName: data.bidderName,
    bidderEmail: data.bidderEmail,
    bidderId: data.bidderId,
  });

  return { ok: true, newBid: data.amount };
}
