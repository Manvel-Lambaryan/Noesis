import { AuthFailure } from "../../auth/auth-failure";

export const DISCOVERY_VIEWS = ["general", "javascript", "business_apps"] as const;

export type DiscoveryViewId = (typeof DISCOVERY_VIEWS)[number];

export type DiscoveryHit = {
  productId: string;
  kind: string;
  stacks: readonly string[];
};

export type ListingQuery = {
  view: DiscoveryViewId;
  text: string | null;
  stack: string | null;
  categorySlug: string | null;
  kind: string | null;
  cursorUpdatedAt: string | null;
  cursorProductId: string | null;
  limit: number;
};

export function matchesView(hit: DiscoveryHit, view: DiscoveryViewId): boolean {
  if (view === "general") {
    return true;
  }
  if (view === "javascript") {
    return hit.stacks.includes("javascript") || hit.stacks.includes("typescript");
  }
  return hit.kind === "business_application";
}

export function parseListingQuery(input: Record<string, unknown>): ListingQuery {
  const view = input.view;
  if (!isView(view)) {
    throw new AuthFailure(400, "validation_failed", "Choose a marketplace view.");
  }
  const cursor = decodeCursor(textOrNull(input.cursor));
  return {
    view,
    text: clip(textOrNull(input.q), 80),
    stack: codeOrNull(input.stack),
    categorySlug: codeOrNull(input.category),
    kind: kindOrNull(input.kind),
    cursorUpdatedAt: cursor?.updatedAt ?? null,
    cursorProductId: cursor?.productId ?? null,
    limit: limitOf(input.limit),
  };
}

export function encodeCursor(updatedAt: string, productId: string): string {
  return Buffer.from(`${updatedAt}|${productId}`).toString("base64url");
}

function isView(value: unknown): value is DiscoveryViewId {
  return typeof value === "string" && DISCOVERY_VIEWS.some((item) => item === value);
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function clip(value: string | null, max: number): string | null {
  return value === null ? null : value.slice(0, max);
}

function codeOrNull(value: unknown): string | null {
  const text = textOrNull(value);
  if (text === null) {
    return null;
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,79})$/.test(text)) {
    throw new AuthFailure(400, "validation_failed", "Filter values use lowercase letters, numbers, and hyphens.");
  }
  return text;
}

function kindOrNull(value: unknown): string | null {
  const text = textOrNull(value);
  if (text === null) {
    return null;
  }
  if (text !== "code_asset" && text !== "business_application") {
    throw new AuthFailure(400, "validation_failed", "Product type filter is invalid.");
  }
  return text;
}

function limitOf(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 20;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new AuthFailure(400, "validation_failed", "Limit must be from 1 to 50.");
  }
  return parsed;
}

function decodeCursor(value: string | null): { updatedAt: string; productId: string } | null {
  if (value === null) {
    return null;
  }
  const decoded = Buffer.from(value, "base64url").toString("utf8");
  const splitAt = decoded.lastIndexOf("|");
  const updatedAt = decoded.slice(0, splitAt);
  const productId = decoded.slice(splitAt + 1);
  if (splitAt < 1 || Number.isNaN(Date.parse(updatedAt))) {
    throw new AuthFailure(400, "validation_failed", "Cursor is invalid.");
  }
  return { updatedAt, productId };
}
