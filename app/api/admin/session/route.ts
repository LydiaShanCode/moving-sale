import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

export async function GET() {
  const isAdmin = await isAdminRequest();
  return NextResponse.json({ isAdmin });
}
