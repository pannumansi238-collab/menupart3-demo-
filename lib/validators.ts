import { z } from "zod";

export const orderInputSchema = z.object({
  tableNumber: z.number().int().min(1).max(999).nullable(),
  instructions: z.string().trim().max(500).default(""),
  items: z.array(z.object({
    itemId: z.string().min(1).max(64),
    quantity: z.number().int().min(1).max(30),
    note: z.string().trim().max(240).default("")
  })).min(1).max(40)
}).strict();

export const loginSchema = z.object({
  password: z.string().min(1).max(128)
}).strict();

export const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["New", "Preparing", "Ready", "Served", "Paid"])
}).strict();

export const menuItemSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  price: z.number().int().min(1).max(100000),
  category: z.enum(["Starters", "Mains", "Biryani & Rice", "Breads", "Desserts", "Drinks"]),
  cuisine: z.string().trim().min(1).max(50),
  diet: z.enum(["veg", "non-veg"]),
  spice: z.number().int().min(0).max(3),
  bestseller: z.boolean(),
  chefSpecial: z.boolean(),
  available: z.boolean(),
  image: z.string().max(500).refine(
    (value) => (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\/[^/]+\/storage\/v1\/object\/public\/menu-images\//.test(value),
    "Use a local path or a public menu-images storage URL."
  ),
  tags: z.array(z.string().trim().min(1).max(30)).max(12)
}).strict();

export const menuPatchSchema = menuItemSchema.omit({ id: true }).partial().strict();

export const redeemSchema = z.object({ code: z.string().trim().min(8).max(40) }).strict();
