import { NextResponse } from "next/server";
import { hasStaffSession } from "@/lib/auth";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";
import { orderInputSchema, orderStatusSchema } from "@/lib/validators";
import type { OrderStatus } from "@/types/menu";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    if (!await enforceRateLimit(request, "orders", 8, 60)) {
      return NextResponse.json({ error: "Too many order attempts. Please wait a moment and try again." }, { status: 429 });
    }
    const parsed = await readJson(request, orderInputSchema);
    if (!parsed.success) return parsed.response;
    const { data, error } = await getSupabase().rpc("place_order", {
      p_table_number: parsed.data.tableNumber,
      p_instructions: parsed.data.instructions,
      p_items: parsed.data.items
    });
    if (error) {
      const unavailable = error.message.toLowerCase().includes("unavailable");
      return NextResponse.json({ error: unavailable ? "One of those dishes is sold out. Please refresh your menu." : "We couldn’t send your order. Please try again." }, { status: unavailable ? 409 : 500 });
    }
    return NextResponse.json({ orderId: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Could not place order.");
  }
}

export async function GET() {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const { data, error } = await getSupabase().from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100);
    if (error) return errorResponse(error, "Could not load orders.");
    return NextResponse.json({ orders: data });
  } catch (error) {
    return errorResponse(error, "Could not load orders.");
  }
}

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  New: "Preparing", Preparing: "Ready", Ready: "Served", Served: "Paid", Paid: null
};

export async function PATCH(request: Request) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const parsed = await readJson(request, orderStatusSchema);
    if (!parsed.success) return parsed.response;
    const supabase = getSupabase();
    const { data: current, error: readError } = await supabase.from("orders").select("status").eq("id", parsed.data.orderId).single();
    if (readError) return errorResponse(readError, "Could not find that order.");
    if (nextStatus[current.status as OrderStatus] !== parsed.data.status) {
      return NextResponse.json({ error: `Order can’t move directly from ${current.status} to ${parsed.data.status}.` }, { status: 409 });
    }
    const { error } = await supabase.from("orders").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", parsed.data.orderId);
    if (error) return errorResponse(error, "Could not update order.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Could not update order.");
  }
}
