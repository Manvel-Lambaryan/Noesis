import type { ProductRow } from "./workspace-view";

export type WorkspaceLink = { href: string; label: string; phase: "now" | "later" };

export type WorkspaceGroup = { label: string; links: WorkspaceLink[] };

export type NavCounts = {
  all: number;
  drafts: number;
  published: number;
  review: number;
  rejected: number;
};

const PRODUCT_COUNTS: Record<string, keyof NavCounts> = {
  "/account/products": "all",
  "/account/products?listing=draft": "drafts",
  "/account/products?listing=published": "published",
  "/account/products?queue=review": "review",
  "/account/products?queue=rejected": "rejected",
};

export const WORKSPACE_NAV: WorkspaceGroup[] = [
  { label: "Overview", links: [{ href: "/account", label: "Dashboard", phase: "now" }] },
  {
    label: "Products",
    links: [
      { href: "/account/products", label: "All Products", phase: "now" },
      { href: "/account/products?listing=draft", label: "Drafts", phase: "now" },
      { href: "/account/products?listing=published", label: "Published", phase: "now" },
      { href: "/account/products?queue=review", label: "Under Review", phase: "now" },
      { href: "/account/products?queue=rejected", label: "Rejected", phase: "now" },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/account/sales", label: "Orders", phase: "later" },
      { href: "/account/customers", label: "Customers", phase: "later" },
      { href: "/account/licenses", label: "Licenses", phase: "later" },
    ],
  },
  {
    label: "Finance",
    links: [
      { href: "/account/finance", label: "Overview", phase: "later" },
      { href: "/account/finance/transactions", label: "Transactions", phase: "later" },
      { href: "/account/finance/earnings", label: "Earnings", phase: "later" },
      { href: "/account/finance/payouts", label: "Payouts", phase: "later" },
    ],
  },
  {
    label: "Communication",
    links: [
      { href: "/account/inbox", label: "Messages", phase: "later" },
      { href: "/account/calls", label: "Calls & Meetings", phase: "later" },
      { href: "/account/inquiries", label: "Inquiries", phase: "later" },
    ],
  },
  {
    label: "Analytics",
    links: [
      { href: "/account/analytics", label: "Overview", phase: "later" },
      { href: "/account/analytics?view=products", label: "Products", phase: "later" },
      { href: "/account/analytics?view=traffic", label: "Traffic", phase: "later" },
    ],
  },
  {
    label: "Activity",
    links: [
      { href: "/account/activity", label: "History", phase: "now" },
      { href: "/account/notifications", label: "Notifications", phase: "later" },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/account/profile", label: "Profile & Verification", phase: "now" },
      { href: "/account/settings", label: "Settings", phase: "now" },
    ],
  },
];

export function navCounts(products: readonly ProductRow[]): NavCounts {
  const counts: NavCounts = { all: products.length, drafts: 0, published: 0, review: 0, rejected: 0 };
  for (const row of products) {
    if (row.listingState === "draft") counts.drafts += 1;
    if (row.listingState === "published") counts.published += 1;
    if (row.versionState === "pending_moderation") counts.review += 1;
    if (row.versionState === "rejected" || row.versionState === "scan_rejected" || row.listingState === "taken_down") counts.rejected += 1;
  }
  return counts;
}

export function badgeFor(href: string, counts: NavCounts | null): number | null {
  if (counts === null) return null;
  const key = PRODUCT_COUNTS[href];
  if (key === undefined) return null;
  const value = counts[key];
  return value > 0 ? value : null;
}

export function workspaceTitle(path: string): string {
  if (path.startsWith("/account/products")) return "Products";
  if (path.startsWith("/account/sales") || path.startsWith("/account/customers") || path.startsWith("/account/licenses")) return "Sales";
  if (path.startsWith("/account/finance")) return "Finance";
  if (path.startsWith("/account/inbox") || path.startsWith("/account/calls") || path.startsWith("/account/inquiries")) return "Communication";
  if (path.startsWith("/account/analytics")) return "Analytics";
  if (path.startsWith("/account/activity")) return "Activity";
  if (path.startsWith("/account/notifications")) return "Notifications";
  if (path.startsWith("/account/profile") || path.startsWith("/account/verification")) return "Profile";
  if (path.startsWith("/account/settings")) return "Settings";
  return "Dashboard";
}

export function catalogTitle(query: { listing?: string; queue?: string }): string {
  if (query.queue === "review") return "Under Review";
  if (query.queue === "rejected") return "Rejected";
  if (query.queue === "attention") return "Needs action";
  if (query.listing === "draft") return "Drafts";
  if (query.listing === "published") return "Published";
  if (query.listing === "unpublished") return "Unpublished";
  if (query.listing === "taken_down") return "Taken down";
  if (query.listing === "appeal_pending") return "Appeals";
  return "All Products";
}

export function linkActive(href: string, path: string, search: string): boolean {
  const [target, query] = href.split("?");
  if (target === undefined) return false;
  const current = search.startsWith("?") ? search.slice(1) : search;
  if ((query ?? "") !== current) return false;
  if (path === target) return true;
  if (target === "/account/profile" && path.startsWith("/account/verification")) return true;
  return target === "/account/products" && path.startsWith("/account/products/");
}
