import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import {
  getAdminItems,
  markItemSold,
  updateItemPrice,
  addItem,
} from "@/lib/store";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await getAdminItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/admin/items", error);
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const itemId = Number(body.itemId);

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    if (body.action === "sold") {
      await markItemSold(itemId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "price") {
      const price = Number(body.price);
      if (!price || price <= 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      await updateItemPrice(itemId, price);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/items", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, price, category, description, imagePaths } = body;

    if (!name?.trim() || !imagePaths?.length) {
      return NextResponse.json(
        { error: "name and imagePaths required" },
        { status: 400 }
      );
    }

    const id = await addItem({
      name: String(name).trim(),
      price: Number(price) || 20,
      category: String(category) || "Utility",
      description: String(description) || "",
      imagePaths: imagePaths as string[],
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("POST /api/admin/items", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
