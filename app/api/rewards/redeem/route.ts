import { NextResponse } from "next/server";
import { hasStaffSession } from "@/lib/auth";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { redeemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const parsed = await readJson(request, redeemSchema);
    if (!parsed.success) return parsed.response;
    const { data, error } = await getSupabase().rpc("redeem_reward", { p_code: parsed.data.code.toUpperCase() });
    if (error) return errorResponse(error, "Could not verify reward.");
    if (!data) return NextResponse.json({ error: "That reward code is invalid, expired or already used." }, { status: 404 });
    return NextResponse.json({ reward: data });
  } catch (error) {
    return errorResponse(error, "Could not verify reward.");
  }
}
