import type { CategoryOption } from "../../lib/marketplace";

export type CategoryTone = "dark" | "light";

export type ExploreCategory = {
  id: string;
  slug: string;
  title: string;
  href: string;
  image: string | null;
  fit: "contain" | "cover";
  tone: CategoryTone;
};

const CUTOUT = "contain" as const;

const ART: Record<string, { src: string; fit: "contain" }> = {
  "ui-components": { src: "/brand/categories/ui-components.webp", fit: CUTOUT },
  authentication: { src: "/brand/categories/authentication.webp", fit: CUTOUT },
  dashboards: { src: "/brand/categories/dashboards.webp", fit: CUTOUT },
  "backend-modules": { src: "/brand/categories/backend-modules.webp", fit: CUTOUT },
  "api-integrations": { src: "/brand/categories/api-integrations.webp", fit: CUTOUT },
  "website-templates": { src: "/brand/categories/website-templates.webp", fit: CUTOUT },
  "e-commerce": { src: "/brand/categories/e-commerce.webp", fit: CUTOUT },
  "business-applications": { src: "/brand/categories/business-applications.webp", fit: CUTOUT },
  "mobile-applications": { src: "/brand/categories/mobile-applications.webp", fit: CUTOUT },
  "developer-tools": { src: "/brand/categories/developer-tools.webp", fit: CUTOUT },
};

const CANON: readonly CategoryOption[] = [
  { id: "ui-components", slug: "ui-components", name: "UI Components" },
  { id: "authentication", slug: "authentication", name: "Authentication" },
  { id: "dashboards", slug: "dashboards", name: "Dashboards" },
  { id: "backend-modules", slug: "backend-modules", name: "Backend Modules" },
  { id: "api-integrations", slug: "api-integrations", name: "API & Integrations" },
  { id: "website-templates", slug: "website-templates", name: "Website Templates" },
  { id: "e-commerce", slug: "e-commerce", name: "E-commerce" },
  { id: "business-applications", slug: "business-applications", name: "Business Applications" },
  { id: "mobile-applications", slug: "mobile-applications", name: "Mobile Applications" },
  { id: "developer-tools", slug: "developer-tools", name: "Developer Tools" },
];

export function exploreCategories(loaded: CategoryOption[]): ExploreCategory[] {
  const source = loaded.length > 0 ? loaded : CANON;
  return source.map((item, index) => toCard(item, index));
}

function toCard(item: CategoryOption, index: number): ExploreCategory {
  return {
    id: item.id,
    slug: item.slug,
    title: item.name,
    href: `/marketplace/categories/${item.slug}`,
    image: ART[item.slug]?.src ?? null,
    fit: ART[item.slug]?.fit ?? "contain",
    tone: index % 2 === 0 ? "dark" : "light",
  };
}
