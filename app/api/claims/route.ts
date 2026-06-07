import { NextResponse } from "next/server";
import { createClaim } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const itemId = Number(body.itemId);
    const claimerName = String(body.claimerName ?? "");

    if (!itemId || !claimerName.trim()) {
      return NextResponse.json(
        { error: "itemId and claimerName are required" },
        { status: 400 }
      );
    }

    const result = await createClaim(itemId, claimerName);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create claim";
    const status = message.includes("just claimed") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
