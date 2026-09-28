import type { CategoryView, IndexSource } from "./catalog.public-port";
import type { ProductKindName } from "./product-policy";
import type { PreviewType } from "./preview-bytes";

export type PreviewView = {
  id: string;
  url: string;
  contentType: string;
  byteSize: number;
};

export type ProductRecord = {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  summary: string;
  kind: ProductKindName;
  categoryId: string;
  listingState: string;
  stacks: string[];
  tags: string[];
  previews: PreviewView[];
  createdAt: Date;
  updatedAt: Date;
};

export type ProductDraftInput = {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  summary: string;
  kind: ProductKindName;
  categoryId: string;
  stacks: string[];
  tags: string[];
};

export type ProductPatch = {
  title?: string;
  summary?: string;
  kind?: ProductKindName;
  categoryId?: string;
  slug?: string;
  stacks?: string[];
  tags?: string[];
};

export type PreviewIntentRecord = {
  id: string;
  contentType: PreviewType;
  byteSize: number;
};

export type CatalogRepository = {
  listActiveCategories(): Promise<CategoryView[]>;
  categoryExists(id: string): Promise<boolean>;
  create(input: ProductDraftInput): Promise<ProductRecord>;
  updateDraft(id: string, patch: ProductPatch): Promise<ProductRecord | null>;
  findById(id: string): Promise<ProductRecord | null>;
  listBySeller(sellerId: string): Promise<ProductRecord[]>;
  listForIndex(): Promise<IndexSource[]>;
  countPreviews(productId: string): Promise<number>;
  createIntent(id: string, productId: string, contentType: PreviewType, byteSize: number, expiresAt: Date): Promise<void>;
  takeIntent(id: string, productId: string, now: Date): Promise<PreviewIntentRecord | null>;
  addPreview(id: string, productId: string, objectKey: string, contentType: PreviewType, byteSize: number): Promise<PreviewView>;
  transitionListing(id: string, from: ("draft" | "unpublished")[], to: "published"): Promise<boolean>;
};

export const CATALOG_REPOSITORY = Symbol("CATALOG_REPOSITORY");
