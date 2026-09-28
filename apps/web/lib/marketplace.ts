import { cookies } from "next/headers";
import { apiFetch, isRecord } from "./api";
import { SESSION_COOKIE } from "./session-cookie";

export type ListingCard = {
  productId: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  categoryName: string;
  categorySlug: string;
  stacks: string[];
  tags: string[];
  previewUrl: string | null;
  price: { offerId: string; amountMinor: string; currency: string } | null;
  licenseSummary: string | null;
  updatePolicy: string | null;
  demoUrl: string | null;
};

export type CategoryOption = { id: string; slug: string; name: string };

export type DraftProduct = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  categoryId: string;
  listingState: string;
  stacks: string[];
  tags: string[];
  previews: { id: string; url: string; contentType: string }[];
};

export async function loadListings(params: URLSearchParams): Promise<{ items: ListingCard[]; error: string | null }> {
  try {
    const result = await apiFetch(`/v1/discovery/listings?${params.toString()}`, { method: "GET" });
    if (result.status !== 200 || !isRecord(result.body) || !Array.isArray(result.body.items)) {
      return { items: [], error: "The marketplace is unavailable right now." };
    }
    return {
      items: result.body.items.flatMap((item) => {
        const listed = card(item);
        return listed === null ? [] : [listed];
      }),
      error: null,
    };
  } catch {
    return { items: [], error: "The marketplace is unavailable right now." };
  }
}

export async function loadListing(slug: string): Promise<ListingCard | null> {
  try {
    const result = await apiFetch(`/v1/listings/${encodeURIComponent(slug)}`, { method: "GET" });
    return result.status === 200 ? card(result.body) : null;
  } catch {
    return null;
  }
}

export async function loadCategories(): Promise<CategoryOption[]> {
  try {
    const result = await apiFetch("/v1/categories", { method: "GET" });
    if (!Array.isArray(result.body)) {
      return [];
    }
    return result.body.flatMap((item) => {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.slug !== "string" || typeof item.name !== "string") {
        return [];
      }
      return [{ id: item.id, slug: item.slug, name: item.name }];
    });
  } catch {
    return [];
  }
}

export async function loadOwnProducts(): Promise<DraftProduct[]> {
  const result = await sellerFetch("/v1/seller/products");
  if (result === null || !isRecord(result) || !Array.isArray(result.products)) {
    return [];
  }
  return result.products.flatMap((item) => {
    const product = asDraft(item);
    return product === null ? [] : [product];
  });
}

export async function loadOwnProduct(id: string): Promise<DraftProduct | null> {
  const result = await sellerFetch(`/v1/seller/products/${encodeURIComponent(id)}`);
  return result === null ? null : asDraft(result);
}

async function sellerFetch(path: string): Promise<unknown> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return null;
  }
  const result = await apiFetch(path, { method: "GET", sessionToken: token });
  return result.status === 200 ? result.body : null;
}

function card(value: unknown): ListingCard | null {
  if (!isRecord(value) || typeof value.productId !== "string" || typeof value.slug !== "string" || typeof value.title !== "string") {
    return null;
  }
  const category = isRecord(value.category) ? value.category : {};
  const previews = Array.isArray(value.previews) ? value.previews : [];
  const first = previews.find(isRecord);
  return {
    productId: value.productId,
    slug: value.slug,
    title: value.title,
    summary: typeof value.summary === "string" ? value.summary : "",
    kind: typeof value.kind === "string" ? value.kind : "",
    categoryName: typeof category.name === "string" ? category.name : "",
    categorySlug: typeof category.slug === "string" ? category.slug : "",
    stacks: strings(value.stacks),
    tags: strings(value.tags),
    previewUrl: first !== undefined && typeof first.url === "string" ? first.url : null,
    price: priceOf(value.price),
    licenseSummary: typeof value.licenseSummary === "string" ? value.licenseSummary : null,
    updatePolicy: typeof value.updatePolicy === "string" ? value.updatePolicy : null,
    demoUrl: typeof value.demoUrl === "string" ? value.demoUrl : null,
  };
}

function priceOf(value: unknown): ListingCard["price"] {
  if (!isRecord(value) || typeof value.offerId !== "string" || typeof value.amountMinor !== "string" || typeof value.currency !== "string") {
    return null;
  }
  return { offerId: value.offerId, amountMinor: value.amountMinor, currency: value.currency };
}

function asDraft(value: unknown): DraftProduct | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  return {
    id: value.id,
    slug: typeof value.slug === "string" ? value.slug : "",
    title: value.title,
    summary: typeof value.summary === "string" ? value.summary : "",
    kind: typeof value.kind === "string" ? value.kind : "code_asset",
    categoryId: typeof value.categoryId === "string" ? value.categoryId : "",
    listingState: typeof value.listingState === "string" ? value.listingState : "draft",
    stacks: strings(value.stacks),
    tags: strings(value.tags),
    previews: Array.isArray(value.previews) ? value.previews.flatMap(preview) : [],
  };
}

function preview(value: unknown): { id: string; url: string; contentType: string }[] {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.url !== "string") {
    return [];
  }
  return [{ id: value.id, url: value.url, contentType: typeof value.contentType === "string" ? value.contentType : "" }];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
