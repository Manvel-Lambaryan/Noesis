import type { CategoryOption } from "../../lib/marketplace";

export type CategorySpan = "feature" | "regular" | "wide";
export type CategoryTone = "dark" | "light";

export type ExploreCategory = {
  id: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  image: string;
  tone: CategoryTone;
  span: CategorySpan;
};

type Face = {
  slug: string;
  name: string;
  description: string;
  image: string;
  tone: CategoryTone;
  span: CategorySpan;
};

const FACES: readonly Face[] = [
  { slug: "business-applications", name: "Business Applications", description: "Complete solutions for real-world business needs. CRMs, ERPs and HR tools.", image: "/brand/categories/business-applications.jpg", tone: "dark", span: "feature" },
  { slug: "dashboards", name: "Dashboards", description: "Analytics panels and ready-to-launch SaaS screens.", image: "/brand/categories/dashboards.jpg", tone: "light", span: "feature" },
  { slug: "e-commerce", name: "E-commerce", description: "Storefronts, catalogs and checkout flows.", image: "/brand/categories/e-commerce.jpg", tone: "dark", span: "feature" },
  { slug: "ui-components", name: "UI Components", description: "Reusable interface pieces for modern apps.", image: "/brand/categories/ui-components.jpg", tone: "dark", span: "regular" },
  { slug: "api-integrations", name: "API & Integrations", description: "Connect services, webhooks and automation.", image: "/brand/categories/api-integrations.jpg", tone: "light", span: "regular" },
  { slug: "mobile-applications", name: "Mobile Applications", description: "Phone UI kits and app shells.", image: "/brand/categories/mobile-applications.jpg", tone: "dark", span: "regular" },
  { slug: "website-templates", name: "Website Templates", description: "Responsive pages ready to publish.", image: "/brand/categories/website-templates.jpg", tone: "light", span: "regular" },
  { slug: "developer-tools", name: "Developer Tools", description: "CLIs, boilerplates and editor utilities.", image: "/brand/categories/developer-tools.jpg", tone: "dark", span: "wide" },
];

export function exploreCategories(loaded: CategoryOption[]): ExploreCategory[] {
  const bySlug = new Map(loaded.map((item) => [item.slug, item]));
  return FACES.flatMap((face) => toCard(face, bySlug.get(face.slug), loaded.length > 0));
}

function toCard(face: Face, live: CategoryOption | undefined, strict: boolean): ExploreCategory[] {
  if (strict && live === undefined) {
    return [];
  }
  return [{
    id: live?.id ?? face.slug,
    slug: face.slug,
    title: live?.name ?? face.name,
    description: face.description,
    href: `/marketplace/categories/${face.slug}`,
    image: face.image,
    tone: face.tone,
    span: face.span,
  }];
}
