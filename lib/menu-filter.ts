import type { MenuCategory, MenuItem } from "@/types/menu";

export interface MenuFilters {
  category: "All" | MenuCategory;
  diet: "all" | "veg" | "non-veg";
  region: string;
  spice: number;
  search: string;
  sort: string;
}

export function filterMenuItems(items: MenuItem[], filters: MenuFilters) {
  const search = filters.search.trim().toLowerCase();
  const filtered = items.filter((item) => item.available &&
    (filters.category === "All" || item.category === filters.category) &&
    (filters.diet === "all" || item.diet === filters.diet) &&
    (filters.region === "All regions" || item.cuisine === filters.region) &&
    (filters.spice === 0 || item.spice === filters.spice) &&
    (!search || `${item.name} ${item.description} ${item.cuisine} ${item.tags.join(" ")}`.toLowerCase().includes(search)));
  if (filters.sort === "price-low") return filtered.sort((a, b) => a.price - b.price);
  if (filters.sort === "price-high") return filtered.sort((a, b) => b.price - a.price);
  if (filters.sort === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
  return filtered.sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
}
