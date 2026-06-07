/**
 * File-backed store when POSTGRES_URL is unset (local dev only).
 */
import fs from "fs";
import path from "path";
import type { SaleItemPublic, SaleItemAdmin, ClaimResult } from "./types";

type SeedItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  status: string;
  queueCount: number;
  description: string;
  imagePaths: string[];
  sortOrder: number;
};

type DevBid = {
  itemId: number;
  amount: number;
  bidderName: string;
  bidderEmail: string;
  bidderId: string;
};

type DevState = {
  items: SeedItem[];
  claims: { itemId: number; claimerName: string; position: number }[];
  bids: DevBid[];
};

const statePath = path.join(process.cwd(), ".data", "dev-state.json");
const seedPath = path.join(process.cwd(), "scripts", "seed-data.json");

function loadState(): DevState {
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  }
  const seed: SeedItem[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const state: DevState = { items: seed, claims: [], bids: [] };
  saveState(state);
  return state;
}

function saveState(state: DevState) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function toPublic(item: SeedItem): SaleItemPublic {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    startingBid: Math.round(item.price * 0.4),
    currentBid: null,
    bidCount: 0,
    category: item.category,
    description: item.description,
    status: item.status as SaleItemPublic["status"],
    images: item.imagePaths,
    queue: item.queueCount,
  };
}

export function isDevStoreMode() {
  return !process.env.POSTGRES_URL && process.env.NODE_ENV !== "production";
}

export function devGetCatalogStats(): { available: number; total: number } {
  const state = loadState();
  const available = state.items.filter((i) => i.status === "available").length;
  return { available, total: state.items.length };
}

export function devGetPublicItems(): SaleItemPublic[] {
  return loadState()
    .items.filter((i) => i.status === "available")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toPublic);
}

export function devGetAdminItems(): SaleItemAdmin[] {
  const state = loadState();
  return state.items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      const claim = state.claims.find(
        (c) => c.itemId === item.id && c.position === 1
      );
      return { ...toPublic(item), claimerName: claim?.claimerName ?? null };
    });
}

export function devCreateClaim(
  itemId: number,
  claimerName: string
): ClaimResult {
  const state = loadState();
  const name = claimerName.trim();
  const item = state.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found");

  if (item.status === "available") {
    item.status = "claimed";
    item.queueCount = 0;
    state.claims.push({ itemId, claimerName: name, position: 1 });
    saveState(state);
    return {
      position: 1,
      message: "You got it! I'll reach out to arrange pickup.",
    };
  }

  if (item.status === "claimed") {
    item.queueCount += 1;
    const position = item.queueCount + 1;
    state.claims.push({ itemId, claimerName: name, position });
    saveState(state);
    return {
      position,
      message: `You're #${position} in line. I'll DM you if it opens up.`,
    };
  }

  throw new Error("Item is not available");
}

export function devMarkSold(itemId: number) {
  const state = loadState();
  const item = state.items.find((i) => i.id === itemId);
  if (item) {
    item.status = "claimed";
    saveState(state);
  }
}

export function devUpdatePrice(itemId: number, price: number) {
  const state = loadState();
  const item = state.items.find((i) => i.id === itemId);
  if (item) {
    item.price = price;
    saveState(state);
  }
}

export function devGetBidStats(itemId: number): { currentBid: number | null; bidCount: number } {
  const state = loadState();
  const itemBids = state.bids.filter((b) => b.itemId === itemId);
  if (itemBids.length === 0) return { currentBid: null, bidCount: 0 };
  return {
    currentBid: Math.max(...itemBids.map((b) => b.amount)),
    bidCount: itemBids.length,
  };
}

export function devGetAllBidStats(): Map<number, { currentBid: number | null; bidCount: number }> {
  const state = loadState();
  const map = new Map<number, { currentBid: number | null; bidCount: number }>();
  for (const bid of state.bids) {
    const existing = map.get(bid.itemId);
    map.set(bid.itemId, {
      currentBid: existing ? Math.max(existing.currentBid ?? 0, bid.amount) : bid.amount,
      bidCount: (existing?.bidCount ?? 0) + 1,
    });
  }
  return map;
}

export function devGetTopBidders(): Map<number, { name: string; email: string; amount: number }> {
  const state = loadState();
  const map = new Map<number, { name: string; email: string; amount: number }>();
  for (const bid of state.bids) {
    const existing = map.get(bid.itemId);
    if (!existing || bid.amount > existing.amount) {
      map.set(bid.itemId, { name: bid.bidderName, email: bid.bidderEmail, amount: bid.amount });
    }
  }
  return map;
}

export function devPlaceBid(data: {
  itemId: number;
  amount: number;
  bidderName: string;
  bidderEmail: string;
  bidderId: string;
}): { ok: boolean; newBid: number } {
  const state = loadState();
  const item = state.items.find((i) => i.id === data.itemId);
  if (!item) throw new Error("Item not found");
  if (item.status === "claimed") throw new Error("Item is no longer available");

  const startingBid = Math.round(item.price * 0.4);
  const itemBids = state.bids.filter((b) => b.itemId === data.itemId);
  const currentBid = itemBids.length > 0 ? Math.max(...itemBids.map((b) => b.amount)) : null;
  const minBid = currentBid !== null ? currentBid + 1 : startingBid;

  if (data.amount < minBid) {
    throw new Error(
      currentBid !== null ? `Bid must be above $${currentBid}` : `Minimum bid is $${startingBid}`
    );
  }

  state.bids.push(data);
  saveState(state);
  return { ok: true, newBid: data.amount };
}

export function devAddItem(data: {
  name: string;
  price: number;
  category: string;
  description: string;
  imagePaths: string[];
}) {
  const state = loadState();
  const id = Math.max(0, ...state.items.map((i) => i.id)) + 1;
  state.items.push({
    id,
    ...data,
    status: "available",
    queueCount: 0,
    sortOrder: id,
  });
  saveState(state);
  return id;
}
