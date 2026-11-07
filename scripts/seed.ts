import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

interface SeedItem {
  id: string; slug: string; name: string; description: string; price: number; category: string;
  cuisine: string; diet: string; spice: number; bestseller: boolean; chefSpecial: boolean;
  available: boolean; image: string; tags: string[];
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  const items = JSON.parse(await readFile(resolve(process.cwd(), "data", "menu.json"), "utf8")) as SeedItem[];
  if (items.length !== 60) throw new Error(`Expected exactly 60 menu items, found ${items.length}.`);
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const rows = items.map(({ chefSpecial, ...item }) => ({
    ...item, chef_special: chefSpecial
  }));
  const { error } = await supabase.from("menu_items").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Menu seed failed: ${error.message}`);
  console.log(`Seeded ${items.length} menu items.`);
}

loadEnvConfig(process.cwd());
seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
