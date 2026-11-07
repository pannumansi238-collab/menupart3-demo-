import { NextResponse } from "next/server";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const scratchSchema = z.object({ orderId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  try {
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    if (!await enforceRateLimit(request, "scratch", 4, 60)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
    const parsed = await readJson(request, scratchSchema);
    if (!parsed.success) return parsed.response;
    const { data, error } = await getSupabase().rpc("scratch_reward", { p_order_id: parsed.data.orderId });
    if (error) return errorResponse(error, "Could not reveal reward.");
    return NextResponse.json({ reward: data });
  } catch (error) {
    return errorResponse(error, "Could not reveal reward.");
  }
}
