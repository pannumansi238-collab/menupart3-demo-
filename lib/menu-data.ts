import "server-only";
import { unstable_cache } from "next/cache";
import { menuItems } from "@/data/images";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";

async function loadMenu() {
  if (!hasSupabaseConfig()) {
    if (process.env.NODE_ENV === "production") throw new Error("The menu database is not configured.");
    return menuItems;
  }
  const { data, error } = await getSupabase().from("menu_items").select("*").order("name");
  if (error) throw new Error(`Could not load menu from Supabase: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id, slug: row.slug, name: row.name, description: row.description, price: row.price,
    category: row.category, cuisine: row.cuisine, diet: row.diet, spice: row.spice,
    bestseller: row.bestseller, chefSpecial: row.chef_special, available: row.available,
    image: row.image, tags: row.tags
  }));
}

export const getCachedMenu = unstable_cache(loadMenu, ["rasoi-menu-items-v1"], {
  revalidate: 60,
  tags: ["menu"]
});
