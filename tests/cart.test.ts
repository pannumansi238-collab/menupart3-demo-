import assert from "node:assert/strict";
import test from "node:test";
import menu from "@/data/menu.json";
import type { MenuItem } from "@/types/menu";
import { filterMenuItems } from "@/lib/menu-filter";
import { calculateOrderTotals } from "@/lib/order-math";
import { scratchCoverage } from "@/lib/scratch";
import { orderInputSchema } from "@/lib/validators";

const persisted = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => persisted.get(key) ?? null,
    setItem: (key: string, value: string) => persisted.set(key, value),
    removeItem: (key: string) => persisted.delete(key),
    clear: () => persisted.clear(),
    key: (index: number) => [...persisted.keys()][index] ?? null,
    get length() { return persisted.size; }
  }
});
const paneer = menu.find((item) => item.slug === "paneer-tikka") as MenuItem;

test("the first ADD adds exactly one item and shared quantity stays in sync", async () => {
  const { useCart } = await import("@/store/cart");
  useCart.getState().clear();
  assert.equal(useCart.getState().quantity(paneer.id), 0);
  useCart.getState().add(paneer);
  assert.equal(useCart.getState().quantity(paneer.id), 1);
  useCart.getState().increment(paneer.id);
  assert.equal(useCart.getState().quantity(paneer.id), 2);
  useCart.getState().decrement(paneer.id);
  assert.equal(useCart.getState().quantity(paneer.id), 1);
  useCart.getState().decrement(paneer.id);
  assert.equal(useCart.getState().quantity(paneer.id), 0);
});

test("menu seed covers 50 dishes and 10 drinks across the listed regions", () => {
  const dishes = menu.filter((item) => item.category !== "Drinks");
  const drinks = menu.filter((item) => item.category === "Drinks");
  assert.equal(dishes.length, 50);
  assert.equal(drinks.length, 10);
  for (const cuisine of ["Kashmiri", "Kerala", "Chettinad", "Andhra", "Karnataka", "Bengali", "Odia", "Assamese", "Gujarati", "Rajasthani", "Maharashtrian", "Goan", "Indo-Chinese", "Street Food"]) {
    assert.ok(menu.some((item) => item.cuisine === cuisine), `Missing ${cuisine} dishes`);
  }
});

test("category, region, diet, spice, search and price filters compose", () => {
  const filtered = filterMenuItems(menu as MenuItem[], {
    category: "Mains", diet: "non-veg", region: "Kerala", spice: 2, search: "curry", sort: "price-low"
  });
  assert.deepEqual(filtered.map((item) => item.slug), ["kerala-fish-curry"]);
  const unavailable = { ...menu[0], available: false } as MenuItem;
  assert.deepEqual(filterMenuItems([unavailable], {
    category: "All", diet: "all", region: "All regions", spice: 0, search: "", sort: "popular"
  }), []);
});

test("order input accepts one exact quantity and rejects invalid quantities", () => {
  const valid = { tableNumber: 4, instructions: "", items: [{ itemId: paneer.id, quantity: 1, note: "" }] };
  assert.equal(orderInputSchema.parse(valid).items[0].quantity, 1);
  assert.equal(orderInputSchema.safeParse({ ...valid, items: [{ ...valid.items[0], quantity: 0 }] }).success, false);
  assert.equal(orderInputSchema.safeParse({ ...valid, tableNumber: 1000 }).success, false);
});

test("GST total matches the rounded 5% table calculation", () => {
  assert.deepEqual(calculateOrderTotals(385), { subtotal: 385, gst: 19, total: 404 });
});

test("scratch progress counts only transparent canvas pixels", () => {
  assert.equal(scratchCoverage(new Uint8ClampedArray([10, 10, 10, 0, 10, 10, 10, 255])), 0.5);
  assert.equal(scratchCoverage(new Uint8ClampedArray()), 0);
});
