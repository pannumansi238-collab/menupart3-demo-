import { NextResponse } from "next/server";
import { z } from "zod";
import { databaseUnavailable, errorResponse } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    if (!await enforceRateLimit(_request, "order-status", 120, 60)) return NextResponse.json({ error: "Too many status checks. Please try again shortly." }, { status: 429 });
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const { data, error } = await getSupabase().from("orders").select("id, table_number, status, total, created_at, order_items(name, quantity)").eq("id", id).single();
    if (error) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (error) {
    return errorResponse(error, "Could not load order.");
  }
}
