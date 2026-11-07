import { NextResponse } from "next/server";
import { z } from "zod";
import { hasStaffSession } from "@/lib/auth";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";

const weightsSchema = z.object({
  rewards: z.array(z.object({
    id: z.string().min(1).max(64),
    weight: z.number().int().min(0).max(10000),
    active: z.boolean()
  }).strict()).min(1).max(20)
}).strict();

export async function GET() {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const { data, error } = await getSupabase().from("reward_pool").select("id, label, weight, active").order("id");
    if (error) return errorResponse(error, "Could not load reward settings.");
    return NextResponse.json({ rewards: data });
  } catch (error) {
    return errorResponse(error, "Could not load reward settings.");
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const parsed = await readJson(request, weightsSchema);
    if (!parsed.success) return parsed.response;
    const supabase = getSupabase();
    for (const reward of parsed.data.rewards) {
      const { error } = await supabase.from("reward_pool").update({ weight: reward.weight, active: reward.active }).eq("id", reward.id);
      if (error) return errorResponse(error, "Could not update reward settings.");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Could not update reward settings.");
  }
}
