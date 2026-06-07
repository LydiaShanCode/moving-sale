export const SITE = {
  title: "Lydia's Moving Sale",
  subtitle: "Toronto → NYC",
  description: "Browse and bid on items from Lydia's moving sale. Pickup in Toronto.",
} as const;

// June 12, 2026 at midnight EDT (UTC-4) = June 12 04:00 UTC
export const AUCTION_END = new Date("2026-06-12T04:00:00.000Z");

// Starting bid = 40% of listed price (60% off)
export const STARTING_BID_MULTIPLIER = 0.4;
