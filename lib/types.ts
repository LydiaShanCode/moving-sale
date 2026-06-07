export type ItemStatus = "available" | "claimed";

export type SaleItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  status: ItemStatus;
  imagePaths: string[];
  queueCount: number;
  sortOrder: number;
};

export type SaleItemPublic = {
  id: number;
  name: string;
  price: number;
  startingBid: number;
  currentBid: number | null;
  bidCount: number;
  category: string;
  description: string;
  images: string[];
  status: ItemStatus;
  queue: number;
  topBidder?: { name: string; email: string; amount: number } | null;
};

export type SaleItemAdmin = SaleItemPublic & {
  claimerName?: string | null;
  topBidder?: { name: string; email: string; amount: number } | null;
};

export type ClaimResult = {
  position: number;
  message: string;
};

export type BidResult = {
  ok: boolean;
  newBid: number;
};
