export const UNAVAILABLE_METRICS = ["sales", "revenue", "views", "availableBalance", "pendingPayout"] as const;

export type CheckStatus = "not_started" | "pending" | "approved" | "rejected" | "requires_action" | "unavailable";

export type AttentionItem = {
  id: string;
  severity: "blocked" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
};

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  listingState: string;
  hasPreview: boolean;
  previewUrl: string | null;
  stacks: string[];
  versionLabel: string | null;
  versionState: string | null;
  offer: { amountMinor: string; currency: string } | null;
  updatedAt: string;
};

export type ActivityItem = {
  id: string;
  at: string;
  event: string;
  entity: string;
  status: string;
  kind: "catalog" | "version";
  href: string;
};

export type WorkspaceView = {
  seller: { displayName: string; verificationState: string; memberSince: string | null };
  checks: { email: CheckStatus; seller: CheckStatus; payout: "unavailable" };
  metrics: {
    totalProducts: number;
    publishedProducts: number;
    underReview: number;
    drafts: number;
    needsAction: number;
  };
  unavailable: typeof UNAVAILABLE_METRICS[number][];
  attention: AttentionItem[];
  products: ProductRow[];
  productsCapped: boolean;
  versionsCapped: boolean;
  activity: ActivityItem[];
};

const CHECKS = new Set<CheckStatus>(["not_started", "pending", "approved", "rejected", "requires_action", "unavailable"]);
const SEVERITY = new Set<AttentionItem["severity"]>(["blocked", "warning", "info"]);
const LISTINGS = new Set(["draft", "published", "unpublished", "taken_down", "appeal_pending"]);

export function parseWorkspace(value: unknown): WorkspaceView | null {
  if (!isRecord(value) || !sameList(value.unavailable, UNAVAILABLE_METRICS)) return null;
  const seller = parseSeller(value.seller);
  const checks = parseChecks(value.checks);
  const metrics = parseMetrics(value.metrics);
  const attention = list(value.attention, parseAttention);
  const products = list(value.products, parseProduct);
  const activity = list(value.activity, parseActivity);
  if (seller === null || checks === null || metrics === null || attention === null || products === null || activity === null) return null;
  if (typeof value.productsCapped !== "boolean" || typeof value.versionsCapped !== "boolean") return null;
  return {
    seller,
    checks,
    metrics,
    unavailable: [...UNAVAILABLE_METRICS],
    attention,
    products,
    productsCapped: value.productsCapped,
    versionsCapped: value.versionsCapped,
    activity,
  };
}

export function catalogQuery(input: { listing?: string; queue?: string }): { listing?: string; queue?: string } {
  return {
    listing: input.listing !== undefined && LISTINGS.has(input.listing) ? input.listing : undefined,
    queue: input.queue === "review" || input.queue === "attention" || input.queue === "rejected" ? input.queue : undefined,
  };
}

export function filterCatalog(rows: ProductRow[], query: { listing?: string; queue?: string }): ProductRow[] {
  return rows.filter((row) => matchesCatalog(row, query));
}

export function filterActivity(items: ActivityItem[], kind: string | undefined): ActivityItem[] {
  if (kind === "catalog" || kind === "version") return items.filter((item) => item.kind === kind);
  return items;
}

export function kindLabel(kind: string): string {
  if (kind === "code_asset") return "Code asset";
  if (kind === "business_application") return "Business app";
  return kind;
}

export function listingLabel(state: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished",
    taken_down: "Taken down",
    appeal_pending: "Appeal pending",
  };
  return labels[state] ?? state;
}

export function versionLabel(state: string | null): string {
  if (state === null) return "No version";
  return state.replaceAll("_", " ");
}

export function checkLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: "Not started",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    requires_action: "Needs action",
    unavailable: "Not available",
  };
  return labels[status] ?? "Unknown";
}

export function minorMoney(amountMinor: string, currency: string): string {
  return /^\d+$/.test(amountMinor) && /^[A-Z]{3}$/.test(currency) ? `${amountMinor} ${currency} minor` : "Unavailable";
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function relativeTime(iso: string, nowIso: string): string {
  const then = new Date(iso).getTime();
  const now = new Date(nowIso).getTime();
  if (Number.isNaN(then) || Number.isNaN(now)) return "Unknown time";
  const minutes = Math.round((now - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 45) return days === 1 ? "1 day ago" : `${days} days ago`;
  return formatWhen(iso);
}

function matchesCatalog(row: ProductRow, query: { listing?: string; queue?: string }): boolean {
  if (query.listing !== undefined && row.listingState !== query.listing) return false;
  if (query.queue === "review") return row.versionState === "pending_moderation";
  if (query.queue === "rejected") return isRejected(row);
  if (query.queue === "attention") return needsAction(row);
  return true;
}

function needsAction(row: ProductRow): boolean {
  return row.listingState === "taken_down" || row.listingState === "appeal_pending" || isRejected(row);
}

function isRejected(row: ProductRow): boolean {
  return row.versionState === "rejected" || row.versionState === "scan_rejected" || row.listingState === "taken_down";
}

function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseSeller(value: unknown): WorkspaceView["seller"] | null {
  if (!isRecord(value) || typeof value.displayName !== "string" || typeof value.verificationState !== "string") return null;
  if (value.memberSince !== null && typeof value.memberSince !== "string") return null;
  return { displayName: value.displayName, verificationState: value.verificationState, memberSince: value.memberSince };
}

function parseChecks(value: unknown): WorkspaceView["checks"] | null {
  if (!isRecord(value) || !isCheck(value.email) || !isCheck(value.seller) || value.payout !== "unavailable") return null;
  return { email: value.email, seller: value.seller, payout: "unavailable" };
}

function parseMetrics(value: unknown): WorkspaceView["metrics"] | null {
  if (!isRecord(value)) return null;
  const totalProducts = count(value.totalProducts);
  const publishedProducts = count(value.publishedProducts);
  const underReview = count(value.underReview);
  const drafts = count(value.drafts);
  const needsActionCount = count(value.needsAction);
  if (totalProducts === null || publishedProducts === null || underReview === null || drafts === null || needsActionCount === null) return null;
  return { totalProducts, publishedProducts, underReview, drafts, needsAction: needsActionCount };
}

function parseAttention(value: unknown): AttentionItem | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string" || typeof value.detail !== "string") return null;
  if (!SEVERITY.has(value.severity as AttentionItem["severity"])) return null;
  const href = localHref(value.href);
  if (href === null) return null;
  return { id: value.id, severity: value.severity as AttentionItem["severity"], title: value.title, detail: value.detail, href };
}

function parseProduct(value: unknown): ProductRow | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.slug !== "string" || typeof value.title !== "string") return null;
  if (typeof value.kind !== "string" || typeof value.listingState !== "string" || typeof value.hasPreview !== "boolean") return null;
  if (typeof value.updatedAt !== "string" || !optionalText(value.versionLabel) || !optionalText(value.versionState)) return null;
  const previewUrl = value.previewUrl === undefined ? null : value.previewUrl;
  const stacks = value.stacks === undefined ? [] : value.stacks;
  if (!optionalText(previewUrl) || !stringList(stacks)) return null;
  const offer = parseOffer(value.offer);
  if (offer === undefined) return null;
  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    kind: value.kind,
    listingState: value.listingState,
    hasPreview: value.hasPreview,
    previewUrl,
    stacks,
    versionLabel: value.versionLabel,
    versionState: value.versionState,
    offer,
    updatedAt: value.updatedAt,
  };
}

function parseActivity(value: unknown): ActivityItem | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.at !== "string" || typeof value.event !== "string") return null;
  if (typeof value.entity !== "string" || typeof value.status !== "string" || (value.kind !== "catalog" && value.kind !== "version")) return null;
  const href = localHref(value.href);
  if (href === null) return null;
  return { id: value.id, at: value.at, event: value.event, entity: value.entity, status: value.status, kind: value.kind, href };
}

function parseOffer(value: unknown): ProductRow["offer"] | undefined {
  if (value === null) return null;
  if (!isRecord(value) || typeof value.amountMinor !== "string" || typeof value.currency !== "string") return undefined;
  return { amountMinor: value.amountMinor, currency: value.currency };
}

function list<T>(value: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  for (const item of value) {
    const parsed = parse(item);
    if (parsed === null) return null;
    items.push(parsed);
  }
  return items;
}

function sameList(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && expected.every((item, index) => value[index] === item);
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function isCheck(value: unknown): value is CheckStatus {
  return typeof value === "string" && CHECKS.has(value as CheckStatus);
}

function optionalText(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function localHref(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
