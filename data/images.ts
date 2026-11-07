import menu from "@/data/menu.json";
import type { MenuItem } from "@/types/menu";

export const menuImageBySlug = Object.fromEntries(
  (menu as MenuItem[]).map((item) => [item.slug, item.image])
) as Record<string, string>;

export const menuItems = menu as MenuItem[];
