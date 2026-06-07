import { NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createAdminSession,
  adminCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!verifyAdminPassword(String(password ?? ""))) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
    const token = await createAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookieOptions(token));
    return response;
  } catch (error) {
    console.error("POST /api/admin/login", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
