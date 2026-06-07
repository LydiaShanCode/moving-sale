import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { items, claims } from "./schema";
import type { ClaimResult } from "./types";

export async function createClaim(
  itemId: number,
  claimerName: string
): Promise<ClaimResult> {
  const db = getDb();
  const name = claimerName.trim();
  if (!name) throw new Error("Name is required");

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) throw new Error("Item not found");

  if (item.status === "available") {
    const updated = await db
      .update(items)
      .set({ status: "claimed", queueCount: 0 })
      .where(and(eq(items.id, itemId), eq(items.status, "available")))
      .returning();

    if (updated.length === 0) {
      throw new Error("Item was just claimed by someone else");
    }

    await db.insert(claims).values({
      itemId,
      claimerName: name,
      position: 1,
    });

    return {
      position: 1,
      message: "You got it! I'll reach out to arrange pickup.",
    };
  }

  if (item.status === "claimed") {
    const newQueue = item.queueCount + 1;
    await db
      .update(items)
      .set({ queueCount: newQueue })
      .where(eq(items.id, itemId));

    await db.insert(claims).values({
      itemId,
      claimerName: name,
      position: newQueue + 1,
    });

    const position = newQueue + 1;
    return {
      position,
      message: `You're #${position} in line. I'll DM you if it opens up.`,
    };
  }

  throw new Error("Item is not available");
}
