export type Diet = "veg" | "non-veg";
export type MenuCategory = "Starters" | "Mains" | "Biryani & Rice" | "Breads" | "Desserts" | "Drinks";

export interface MenuItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  cuisine: string;
  diet: Diet;
  spice: 0 | 1 | 2 | 3;
  bestseller: boolean;
  chefSpecial: boolean;
  available: boolean;
  image: string;
  tags: string[];
}

export interface CartLine {
  item: MenuItem;
  quantity: number;
  note: string;
}

export type OrderStatus = "New" | "Preparing" | "Ready" | "Served" | "Paid";
