import type { ListingCard } from "../../lib/marketplace";

export type ProductTone = "saas" | "shop" | "kit" | "mobile" | "admin";

export type FeaturedProduct = {
  id: string;
  title: string;
  meta: string;
  price: string;
  href: string;
  tone: ProductTone;
  previewUrl: string | null;
  featured: boolean;
};

const TONES: ProductTone[] = ["saas", "shop", "kit", "mobile", "admin"];

export const FEATURED_FALLBACK: FeaturedProduct[] = [
  { id: "saas-dashboard", title: "SaaS Dashboard", meta: "Next.js · TypeScript", price: "$49", href: "/marketplace/javascript", tone: "saas", previewUrl: "/brand/previews/saas-dashboard.jpg", featured: false },
  { id: "ecommerce-template", title: "E-commerce Template", meta: "Next.js · Tailwind", price: "$39", href: "/marketplace/business-apps", tone: "shop", previewUrl: "/brand/previews/ecommerce-template.jpg", featured: false },
  { id: "saas-starter", title: "SaaS Starter Kit", meta: "Next.js · Prisma", price: "$79", href: "/marketplace/javascript", tone: "kit", previewUrl: "/brand/previews/saas-starter.jpg", featured: true },
  { id: "mobile-ui", title: "Mobile App UI Kit", meta: "Figma · Mobile", price: "$29", href: "/marketplace", tone: "mobile", previewUrl: "/brand/previews/mobile-ui.jpg", featured: false },
  { id: "admin-dashboard", title: "Admin Dashboard", meta: "React · TypeScript", price: "$59", href: "/marketplace/javascript", tone: "admin", previewUrl: "/brand/previews/admin-dashboard.jpg", featured: false },
  { id: "plugin-pack", title: "Editor Plugin Pack", meta: "TypeScript", price: "$19", href: "/marketplace/javascript", tone: "saas", previewUrl: "/brand/previews/plugin-pack.jpg", featured: false },
  { id: "storefront", title: "Storefront Kit", meta: "Next.js", price: "$45", href: "/marketplace/business-apps", tone: "shop", previewUrl: "/brand/previews/storefront.jpg", featured: false },
];

export function fromListings(items: ListingCard[]): FeaturedProduct[] {
  return items.slice(0, 8).map((item, index) => ({
    id: item.productId,
    title: item.title,
    meta: item.stacks.slice(0, 2).join(" · ") || item.categoryName,
    price: item.price === null ? "View" : formatPrice(item.price.amountMinor, item.price.currency),
    href: `/marketplace/products/${item.slug}`,
    tone: TONES[index % TONES.length] ?? "saas",
    previewUrl: item.previewUrl,
    featured: index === 2,
  }));
}

function formatPrice(amountMinor: string, currency: string): string {
  const minor = Number(amountMinor);
  if (!Number.isFinite(minor)) {
    return `${amountMinor} ${currency}`;
  }
  const major = Math.round(minor / 100);
  return currency === "USD" ? `$${major}` : `${major} ${currency}`;
}
