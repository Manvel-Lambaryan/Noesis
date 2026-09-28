export type CategoryView = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type IndexSource = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  stacks: string[];
  tags: string[];
  previewUrls: string[];
  listingState: string;
  updatedAt: Date;
};

export type CatalogAccess = {
  listForIndex(): Promise<IndexSource[]>;
};

export const CATALOG_ACCESS = Symbol("CATALOG_ACCESS");

export function mediaUrl(objectKey: string): string {
  const base = (process.env.PUBLIC_MEDIA_BASE ?? "http://127.0.0.1:3001").replace(/\/$/, "");
  return `${base}/media/${objectKey}`;
}
