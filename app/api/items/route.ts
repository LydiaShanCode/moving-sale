import { NextResponse } from "next/server";
import { getPublicItems, getCatalogStats } from "@/lib/store";

export async function GET() {
  try {
    const [items, stats] = await Promise.all([
      getPublicItems(),
      getCatalogStats(),
    ]);
    return NextResponse.json({ items, stats });
  } catch (error) {
    console.error("GET /api/items", error);
    return NextResponse.json(
      { error: "Failed to load items" },
      { status: 500 }
    );
  }
}
