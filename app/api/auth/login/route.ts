import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { createStaffToken, staffCookie } from "@/lib/auth";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    if (!await enforceRateLimit(request, "staff-login", 5, 300)) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please wait five minutes." }, { status: 429 });
    }
    const parsed = await readJson(request, loginSchema);
    if (!parsed.success) return parsed.response;
    const hash = process.env.STAFF_PASSWORD_HASH;
    if (!hash) return NextResponse.json({ error: "Staff login is not configured. Set STAFF_PASSWORD_HASH in the deployment environment." }, { status: 503 });
    if (!await compare(parsed.data.password, hash)) return NextResponse.json({ error: "That password didn’t match. Please try again." }, { status: 401 });
    const token = await createStaffToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(staffCookie.name, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
      path: "/", maxAge: staffCookie.maxAge
    });
    return response;
  } catch (error) {
    return errorResponse(error, "Could not sign in.");
  }
}
