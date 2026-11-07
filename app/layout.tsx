import type { Metadata, Viewport } from "next";
import site from "@/config/site";
import SiteShell from "@/components/SiteShell";
import CustomCursor from "@/components/CustomCursor";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
    images: ["/images/menu-placeholder.svg"]
  },
};

export const viewport: Viewport = { themeColor: "#191612" };

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: site.name,
  description: site.description,
  servesCuisine: ["Indian", "Punjabi", "Mughlai", "South Indian", "Bengali"],
  telephone: site.phone,
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address,
    addressCountry: "IN"
  },
  openingHours: ["Mo-Fr 12:00-23:00", "Sa-Su 11:00-23:30"],
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
        <SiteShell>{children}</SiteShell>
        <CustomCursor />
      </body>
    </html>
  );
}
