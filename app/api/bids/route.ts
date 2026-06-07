import { NextResponse } from "next/server";
import { placeBid } from "@/lib/store";
import { getBidStats, isAuctionOpen } from "@/lib/bids";
import { STARTING_BID_MULTIPLIER } from "@/lib/site";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = Number(searchParams.get("itemId"));
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }
  try {
    const stats = await getBidStats(itemId);
    return NextResponse.json({ ...stats, multiplier: STARTING_BID_MULTIPLIER });
  } catch (error) {
    console.error("GET /api/bids", error);
    return NextResponse.json({ error: "Failed to load bids" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuctionOpen()) {
    return NextResponse.json({ error: "Auction has ended" }, { status: 410 });
  }
  try {
    const body = await request.json();
    const itemId = Number(body.itemId);
    const amount = Number(body.amount);
    const bidderName = String(body.name ?? "").trim();
    const bidderEmail = String(body.email ?? "").trim();
    const bidderId = String(body.bidderId ?? "").trim();

    if (!itemId || !amount || !bidderName || !bidderEmail || !bidderId) {
      return NextResponse.json(
        { error: "itemId, amount, name, email, and bidderId are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bidderEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const result = await placeBid({ itemId, amount, bidderName, bidderEmail, bidderId });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to place bid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
