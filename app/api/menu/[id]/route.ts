import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";
import { menuPatchSchema } from "@/lib/validators";
import { hasStaffSession } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const { id } = await params;
    if (!z.string().min(1).max(64).safeParse(id).success) return NextResponse.json({ error: "Invalid menu item id." }, { status: 400 });
    const parsed = await readJson(request, menuPatchSchema);
    if (!parsed.success) return parsed.response;
    const source = parsed.data;
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      update[key === "chefSpecial" ? "chef_special" : key] = value;
    }
    const { data, error } = await getSupabase().from("menu_items").update(update).eq("id", id).select("*").single();
    if (error) return errorResponse(error, "Could not update menu item.");
    revalidateTag("menu", "max");
    return NextResponse.json({ item: data });
  } catch (error) {
    return errorResponse(error, "Could not update menu item.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const { id } = await params;
    if (!z.string().min(1).max(64).safeParse(id).success) return NextResponse.json({ error: "Invalid menu item id." }, { status: 400 });
    const { error } = await getSupabase().from("menu_items").delete().eq("id", id);
    if (error) return errorResponse(error, "Could not delete menu item.");
    revalidateTag("menu", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Could not delete menu item.");
  }
}
