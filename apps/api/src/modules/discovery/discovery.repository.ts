import type { IndexSource } from "../catalog/catalog.public-port";
import type { ListingQuery } from "./discovery-query";

export type PublicListing = {
  productId: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  categorySlug: string;
  categoryName: string;
  stacks: string[];
  tags: string[];
  previewUrls: string[];
  updatedAt: Date;
};

export type DiscoveryRepository = {
  search(query: ListingQuery): Promise<PublicListing[]>;
  findPublished(slug: string): Promise<PublicListing | null>;
  upsert(source: IndexSource): Promise<void>;
  remove(productId: string): Promise<boolean>;
  removeExcept(productIds: readonly string[]): Promise<number>;
};

export const DISCOVERY_REPOSITORY = Symbol("DISCOVERY_REPOSITORY");
