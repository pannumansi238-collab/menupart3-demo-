import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { databaseUnavailable, errorResponse, readJson } from "@/lib/http";
import { getCachedMenu } from "@/lib/menu-data";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { menuItemSchema } from "@/lib/validators";
import { hasStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !hasSupabaseConfig()) {
      return NextResponse.json({ error: "The menu database is not configured." }, { status: 503 });
    }
    if (!await enforceRateLimit(request, "menu", 120, 60)) {
      return NextResponse.json({ error: "Too many menu requests. Please try again shortly." }, { status: 429 });
    }
    const items = await getCachedMenu();
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error, "Could not load menu.");
  }
}

export async function POST(request: Request) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const parsed = await readJson(request, menuItemSchema);
    if (!parsed.success) return parsed.response;
    const item = { ...parsed.data, id: parsed.data.id ?? randomUUID() };
    const { error } = await getSupabase().from("menu_items").insert({
      id: item.id, slug: item.slug, name: item.name, description: item.description, price: item.price,
      category: item.category, cuisine: item.cuisine, diet: item.diet, spice: item.spice,
      bestseller: item.bestseller, chef_special: item.chefSpecial, available: item.available,
      image: item.image, tags: item.tags
    });
    if (error) return errorResponse(error, "Could not add menu item.");
    revalidateTag("menu", "max");
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Could not add menu item.");
  }
}
