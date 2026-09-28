import { Inject, Injectable } from "@nestjs/common";
import { AuthFailure } from "../../auth/auth-failure";
import { SELLABILITY, type Sellability } from "../artifacts/artifacts.public-port";
import { CATALOG_ACCESS, type CatalogAccess, type IndexSource } from "../catalog/catalog.public-port";
import { encodeCursor, parseListingQuery } from "./discovery-query";
import { type DiscoveryAccess } from "./discovery.public-port";
import { DISCOVERY_REPOSITORY, type DiscoveryRepository, type PublicListing } from "./discovery.repository";

@Injectable()
export class DiscoveryService implements DiscoveryAccess {
  constructor(
    @Inject(DISCOVERY_REPOSITORY) private readonly documents: DiscoveryRepository,
    @Inject(CATALOG_ACCESS) private readonly catalog: CatalogAccess,
    @Inject(SELLABILITY) private readonly sellability: Sellability,
  ) {}

  async search(input: Record<string, unknown>) {
    const query = parseListingQuery(input);
    const rows = await this.documents.search(query);
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);
    return {
      items: page.map(toCard),
      nextCursor: rows.length > query.limit && last !== undefined ? encodeCursor(last.updatedAt.toISOString(), last.productId) : null,
    };
  }

  async getBySlug(slug: string) {
    const row = await this.published(slug);
    return { ...toCard(row), licenseSummary: null, price: null, versions: [] };
  }

  async versions(slug: string) {
    await this.published(slug);
    return { versions: [] };
  }

  async rebuild(): Promise<{ indexed: number; removed: number }> {
    const sources = await this.catalog.listForIndex();
    const sellable = await this.sellability.sellableProductIds(sources.map((item) => item.id));
    const counts = { indexed: 0, removed: 0 };
    for (const source of sources) {
      await this.project(source, sellable, counts);
    }
    counts.removed += await this.documents.removeExcept(sources.map((item) => item.id));
    return counts;
  }

  private async project(source: IndexSource, sellable: ReadonlySet<string>, counts: { indexed: number; removed: number }) {
    if (source.listingState === "published" && sellable.has(source.id)) {
      await this.documents.upsert(source);
      counts.indexed += 1;
      return;
    }
    if (await this.documents.remove(source.id)) {
      counts.removed += 1;
    }
  }

  private async published(slug: string): Promise<PublicListing> {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
      throw new AuthFailure(404, "not_found", "Product not found.");
    }
    const row = await this.documents.findPublished(slug);
    if (row === null) {
      throw new AuthFailure(404, "not_found", "Product not found.");
    }
    return row;
  }
}

function toCard(row: PublicListing) {
  return {
    productId: row.productId,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    kind: row.kind,
    category: { slug: row.categorySlug, name: row.categoryName },
    stacks: row.stacks,
    tags: row.tags,
    previews: row.previewUrls.map((url) => ({ url })),
  };
}
