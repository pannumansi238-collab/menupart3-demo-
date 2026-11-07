# Rasoi & Co. digital menu

A mobile-first restaurant site and table-ordering experience built with Next.js App Router, TypeScript, Tailwind CSS, GSAP/ScrollTrigger, Lenis, Framer Motion and Zustand. Supabase Postgres stores live menu changes, orders and rewards; staff sessions use a bcrypt-verified password and an eight-hour, HTTP-only JWT cookie.

## What’s in the project

```text
app/
  about/                  Restaurant story
  api/                    Menu, order, staff auth and reward route handlers
  menu/                   Searchable menu, filters, dish details and cart entry
  orders/[id]/             Live order status and one-time scratch reward
  staff/                   Protected orders, menu, rewards and table QR tools
components/
  cart/ menu/ rewards/ staff/
config/site.ts             Central restaurant identity and contact settings
data/menu.json             50 Indian dishes and 10 drinks
data/images.ts             Central menu image map
docs/IMAGE_PROMPTS.md      One food-photo prompt per menu item
lib/                       Supabase, auth, validation and rate limiting
scripts/seed.ts            Supabase menu seed command
store/cart.ts              Persistent Zustand cart
supabase/schema.sql        Tables, indexes, policies and atomic database functions
tests/cart.test.ts         Cart quantity and menu-coverage tests
```

## Design system

- **Concept:** an editorial Indian kitchen—charcoal, deep masala brown, turmeric gold and warm cream, with fine rules, grain, round seals and restrained spice-red accents.
- **Type:** a system sans for navigation and controls; an installed serif stack for expressive headings and food storytelling. No remote font request is needed to render the site.
- **Spacing:** generous editorial margins on desktop, compact sticky-feeling filters and large tap targets on mobile.
- **Motion:** Lenis and GSAP/ScrollTrigger for desktop smooth scrolling, pin/blur hero transition, parallax and clip-reveal entrances; Framer Motion for filter layout, dish details and cart transitions. Motion is disabled when the OS asks for reduced motion.

## Local setup

1. Use Node.js 20.9 or newer and install packages:

   ```sh
   npm install
   ```

2. Create a Supabase project. In its SQL editor, run [supabase/schema.sql](./supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — the **server-only** service-role key. Never expose it with a `NEXT_PUBLIC_` prefix.
   - `STAFF_PASSWORD_HASH` — a bcrypt hash of the staff password. Generate one with `node -e "require('bcryptjs').hash('your-password', 12).then(console.log)"`.
   - `STAFF_SESSION_SECRET` — a unique random secret of at least 32 characters.
   - `NEXT_PUBLIC_SITE_URL` — local URL now; set the production origin for deployment.
4. Create a **public** Supabase Storage bucket named `menu-images` to enable staff photo uploads. Only the server-side service role uploads objects; public reads are needed for menu display.
5. Seed the 60 starter items:

   ```sh
   npm run seed
   ```

6. Start the app:

   ```sh
   npm run dev
   ```

   `npm run dev` can preview the bundled menu without Supabase. Orders, staff tools and rewards intentionally require the configured database; the app reports missing configuration rather than pretending a write succeeded.

## Validation

```sh
npm run test
npm run typecheck
npm run lint
npm run build
```

The order insert is one Postgres function call: prices, availability and GST are recalculated in the database, and order plus line items are committed together. Reward selection and one-scratch-per-order enforcement also happen in Postgres. Public order, scratch, tracking and sign-in endpoints use the database-backed atomic rate limiter; development without Supabase uses a process-local limiter only.

## Vercel deployment

1. Push the project to a Git provider and import it into Vercel. Use the standard Next.js build and output settings.
2. Add all five environment variables from `.env.example` in **Project → Settings → Environment Variables** for Production (and Preview if desired). Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin.
3. Run [supabase/schema.sql](./supabase/schema.sql) in the production Supabase project's SQL editor, create the public `menu-images` Storage bucket, then run `npm run seed` against that project from a trusted local shell.
4. Deploy and smoke-test `/`, `/menu`, `/staff`, table QR generation, an order and a scratch-card reward. Confirm that the staff cookie is `Secure`, `HttpOnly` and `SameSite=Strict` on the HTTPS domain.
5. Add the custom domain under **Project → Settings → Domains**, configure the DNS records Vercel provides, wait for the domain certificate, then update `NEXT_PUBLIC_SITE_URL` to the custom HTTPS origin and redeploy.

The Vercel runtime uses Supabase as shared state; the local in-memory rate limiter is never used in production. The service-role key is only accessed by route handlers and the seed script.

## Restaurant re-skin

Update the name, address, phone, opening hours, UPI handle, social URLs and palette in [config/site.ts](./config/site.ts). Menu copy, prices, categories and image paths live in [data/menu.json](./data/menu.json). Image paths are centrally indexed in [data/images.ts](./data/images.ts).

## Food imagery

The project includes original local illustrations for the menu, founder-portrait and dining-room placeholders so the initial experience has no broken remote images. They are not photographs. Replace them with approved, licensed photography before representing a real restaurant; menu-food prompts are in [docs/IMAGE_PROMPTS.md](./docs/IMAGE_PROMPTS.md). A local placeholder is also the default for new menu items.
