import type { IndexSource } from "../../modules/catalog/catalog.public-port";
import type { ListingQuery } from "../../modules/discovery/discovery-query";
import type { DiscoveryRepository, PublicListing } from "../../modules/discovery/discovery.repository";
import type { PrismaService } from "../prisma.service";

export class PrismaDiscoveryRepository implements DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: ListingQuery): Promise<PublicListing[]> {
    const cursorTime = query.cursorUpdatedAt === null ? null : new Date(query.cursorUpdatedAt);
    return this.prisma.$queryRaw<PublicListing[]>`
      SELECT product_id AS "productId", slug, title, summary, kind,
        category_slug AS "categorySlug", category_name AS "categoryName",
        stacks, tags, preview_urls AS "previewUrls", updated_at AS "updatedAt"
      FROM catalog.discovery_documents
      WHERE listing_state = 'published'
        AND (
          (${query.view} = 'general')
          OR (${query.view} = 'javascript' AND stacks && ARRAY['javascript', 'typescript']::text[])
          OR (${query.view} = 'business_apps' AND kind = 'business_application')
        )
        AND (${query.stack}::text IS NULL OR ${query.stack} = ANY(stacks))
        AND (${query.categorySlug}::text IS NULL OR category_slug = ${query.categorySlug})
        AND (${query.kind}::text IS NULL OR kind = ${query.kind})
        AND (${query.text}::text IS NULL OR search_vector @@ plainto_tsquery('english', ${query.text}))
        AND (
          ${cursorTime}::timestamptz IS NULL
          OR updated_at < ${cursorTime}
          OR (updated_at = ${cursorTime} AND product_id < ${query.cursorProductId}::uuid)
        )
      ORDER BY updated_at DESC, product_id DESC
      LIMIT ${query.limit + 1}
    `;
  }

  async findPublished(slug: string): Promise<PublicListing | null> {
    const row = await this.prisma.discoveryDocument.findFirst({ where: { slug, listingState: "published" } });
    if (row === null) {
      return null;
    }
    return {
      productId: row.productId,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      kind: row.kind,
      categorySlug: row.categorySlug,
      categoryName: row.categoryName,
      stacks: row.stacks,
      tags: row.tags,
      previewUrls: row.previewUrls,
      updatedAt: row.updatedAt,
    };
  }

  async upsert(source: IndexSource): Promise<void> {
    const data = documentData(source);
    await this.prisma.discoveryDocument.upsert({
      where: { productId: source.id },
      create: { productId: source.id, ...data },
      update: data,
    });
  }

  async remove(productId: string): Promise<boolean> {
    const result = await this.prisma.discoveryDocument.deleteMany({ where: { productId } });
    return result.count > 0;
  }

  async removeExcept(productIds: readonly string[]): Promise<number> {
    const result = await this.prisma.discoveryDocument.deleteMany({
      where: productIds.length === 0 ? {} : { productId: { notIn: [...productIds] } },
    });
    return result.count;
  }
}

function documentData(source: IndexSource) {
  return {
    slug: source.slug,
    title: source.title,
    summary: source.summary,
    kind: source.kind,
    categoryId: source.categoryId,
    categorySlug: source.categorySlug,
    categoryName: source.categoryName,
    stacks: [...source.stacks],
    tags: [...source.tags],
    previewUrls: [...source.previewUrls],
    listingState: "published",
    updatedAt: source.updatedAt,
  };
}
