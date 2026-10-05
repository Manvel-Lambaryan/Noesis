import type { ListingCard } from "../../lib/marketplace";

export type ProductTone = "saas" | "shop" | "kit" | "mobile" | "admin";

export type FeaturedProduct = {
  id: string;
  title: string;
  summary: string;
  meta: string;
  stacks: string[];
  category: string;
  price: string;
  href: string;
  tone: ProductTone;
  previewUrl: string | null;
  featured: boolean;
};

const TONES: ProductTone[] = ["saas", "shop", "kit", "mobile", "admin"];

function mock(id: string, title: string, summary: string, stacks: string[], category: string, price: string, href: string, tone: ProductTone, previewUrl: string, featured = false): FeaturedProduct {
  return { id, title, summary, meta: stacks.join(" · "), stacks, category, price, href, tone, previewUrl, featured };
}

/** Temporary desk copy used only when the live catalog is empty. */
export const FEATURED_FALLBACK: FeaturedProduct[] = [
  mock("saas-dashboard", "SaaS Dashboard", "Analytics panels and admin screens ready to brand.", ["Next.js", "TypeScript"], "Dashboards", "$49", "/marketplace/javascript", "saas", "/brand/previews/saas-dashboard.jpg"),
  mock("ecommerce-template", "E-commerce Template", "Storefront, catalog and checkout for a first launch.", ["Next.js", "Tailwind"], "E-commerce", "$39", "/marketplace/business-apps", "shop", "/brand/previews/ecommerce-template.jpg"),
  mock("saas-starter", "SaaS Starter Kit", "Auth, billing shell and a dashboard to start from.", ["Next.js", "Prisma"], "Business Applications", "$79", "/marketplace/javascript", "kit", "/brand/previews/saas-starter.jpg", true),
  mock("mobile-ui", "Mobile App UI Kit", "Phone screens for iOS and Android product shells.", ["Figma", "Mobile"], "Mobile Applications", "$29", "/marketplace", "mobile", "/brand/previews/mobile-ui.jpg"),
  mock("admin-dashboard", "Admin Dashboard", "Operations views for teams that need a back office.", ["React", "TypeScript"], "Dashboards", "$59", "/marketplace/javascript", "admin", "/brand/previews/admin-dashboard.jpg"),
  mock("plugin-pack", "Editor Plugin Pack", "Editor utilities and small tools for daily work.", ["TypeScript"], "Developer Tools", "$19", "/marketplace/javascript", "saas", "/brand/previews/plugin-pack.jpg"),
  mock("storefront", "Storefront Kit", "A compact shop front with product and cart screens.", ["Next.js"], "E-commerce", "$45", "/marketplace/business-apps", "shop", "/brand/previews/storefront.jpg"),
];

export function fromListings(items: ListingCard[]): FeaturedProduct[] {
  return items.slice(0, 8).map((item, index) => ({
    id: item.productId,
    title: item.title,
    summary: item.summary,
    meta: item.stacks.slice(0, 2).join(" · ") || item.categoryName,
    stacks: item.stacks.slice(0, 3),
    category: item.categoryName,
    price: item.price === null ? "View" : formatPrice(item.price.amountMinor, item.price.currency),
    href: `/marketplace/products/${item.slug}`,
    tone: TONES[index % TONES.length] ?? "saas",
    previewUrl: item.previewUrl,
    featured: index === 2,
  }));
}

const HERO_FAN = 7;

/** Live listings, padded with the temporary desk set when the fan would be too short. */
export function heroProducts(products: FeaturedProduct[]): FeaturedProduct[] {
  if (products.length >= HERO_FAN) return products;
  const present = new Set(products.map((item) => item.id));
  const fillers = FEATURED_FALLBACK.filter((item) => !present.has(item.id)).map((item) => ({ ...item, featured: false }));
  const filled = [...products, ...fillers].slice(0, HERO_FAN);
  if (filled.some((item) => item.featured)) return filled;
  return filled.map((item, index) => ({ ...item, featured: index === 0 }));
}

export function launchProducts(products: FeaturedProduct[]): FeaturedProduct[] {
  return products.slice(0, 4);
}

/** Listed products for the popular rail. Not a ranked weekly chart. */
export function trendingProducts(products: FeaturedProduct[]): FeaturedProduct[] {
  return products;
}

function formatPrice(amountMinor: string, currency: string): string {
  const minor = Number(amountMinor);
  if (!Number.isFinite(minor)) {
    return `${amountMinor} ${currency}`;
  }
  const major = Math.round(minor / 100);
  return currency === "USD" ? `$${major}` : `${major} ${currency}`;
}
