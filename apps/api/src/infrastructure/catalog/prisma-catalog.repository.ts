import { randomUUID } from "node:crypto";
import { AuthFailure } from "../../auth/auth-failure";
import { mediaUrl, type CategoryView, type IndexSource } from "../../modules/catalog/catalog.public-port";
import type {
  CatalogRepository,
  PreviewIntentRecord,
  PreviewView,
  ProductDraftInput,
  ProductPatch,
  ProductRecord,
} from "../../modules/catalog/catalog.repository";
import type { PreviewType } from "../../modules/catalog/preview-bytes";
import type { ProductKindName } from "../../modules/catalog/product-policy";
import type { PrismaService } from "../prisma.service";

const include = { stacks: true, tags: true, previews: true } as const;

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveCategories(): Promise<CategoryView[]> {
    const rows = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({ id: row.id, slug: row.slug, name: row.name, sortOrder: row.sortOrder }));
  }

  async categoryExists(id: string): Promise<boolean> {
    const row = await this.prisma.category.findFirst({ where: { id, active: true }, select: { id: true } });
    return row !== null;
  }

  async create(input: ProductDraftInput): Promise<ProductRecord> {
    try {
      const row = await this.prisma.product.create({ data: createData(input), include });
      return toRecord(row);
    } catch (error) {
      throw mapWriteError(error);
    }
  }

  async updateDraft(id: string, patch: ProductPatch): Promise<ProductRecord | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.product.findFirst({ where: { id, listingState: "draft" }, select: { id: true } });
        if (current === null) {
          return null;
        }
        if (patch.stacks !== undefined) {
          await tx.productStack.deleteMany({ where: { productId: id } });
          await tx.productStack.createMany({ data: patch.stacks.map((stackCode) => ({ productId: id, stackCode })) });
        }
        if (patch.tags !== undefined) {
          await tx.productTag.deleteMany({ where: { productId: id } });
          await tx.productTag.createMany({ data: patch.tags.map((tag) => ({ productId: id, tag })) });
        }
        const row = await tx.product.update({ where: { id }, data: scalarPatch(patch), include });
        return toRecord(row);
      });
    } catch (error) {
      throw mapWriteError(error);
    }
  }

  async findById(id: string): Promise<ProductRecord | null> {
    const row = await this.prisma.product.findUnique({ where: { id }, include });
    return row === null ? null : toRecord(row);
  }

  async listBySeller(sellerId: string): Promise<ProductRecord[]> {
    const rows = await this.prisma.product.findMany({
      where: { sellerId },
      include,
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return rows.map(toRecord);
  }

  async listForIndex(): Promise<IndexSource[]> {
    const rows = await this.prisma.product.findMany({
      include: { stacks: true, tags: true, previews: true, category: true },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      kind: row.kind,
      categoryId: row.categoryId,
      categorySlug: row.category.slug,
      categoryName: row.category.name,
      stacks: row.stacks.map((stack) => stack.stackCode),
      tags: row.tags.map((tag) => tag.tag),
      previewUrls: row.previews.map((preview) => mediaUrl(preview.objectKey)),
      listingState: row.listingState,
      updatedAt: row.updatedAt,
    }));
  }

  async countPreviews(productId: string): Promise<number> {
    return this.prisma.previewImage.count({ where: { productId } });
  }

  async createIntent(id: string, productId: string, contentType: PreviewType, byteSize: number, expiresAt: Date): Promise<void> {
    await this.prisma.previewIntent.create({ data: { id, productId, contentType, byteSize, expiresAt } });
  }

  async takeIntent(id: string, productId: string, now: Date): Promise<PreviewIntentRecord | null> {
    const claimed = await this.prisma.previewIntent.updateMany({
      where: { id, productId, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) {
      return null;
    }
    const row = await this.prisma.previewIntent.findUnique({ where: { id } });
    if (row === null || !isPreviewType(row.contentType)) {
      return null;
    }
    return { id: row.id, contentType: row.contentType, byteSize: row.byteSize };
  }

  async addPreview(id: string, productId: string, objectKey: string, contentType: PreviewType, byteSize: number): Promise<PreviewView> {
    const row = await this.prisma.previewImage.create({ data: { id, productId, objectKey, contentType, byteSize } });
    return { id: row.id, url: mediaUrl(row.objectKey), contentType: row.contentType, byteSize: row.byteSize };
  }

  async transitionListing(id: string, from: ("draft" | "unpublished")[], to: "published"): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({ where: { id, listingState: { in: from } }, data: { listingState: to } });
      if (updated.count !== 1) {
        return false;
      }
      await tx.catalogOutbox.create({
        data: { id: randomUUID(), type: "catalog.listing_published", subjectId: id, payload: JSON.stringify({ productId: id }) },
      });
      return true;
    });
  }
}

function createData(input: ProductDraftInput) {
  return {
    id: input.id,
    sellerId: input.sellerId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    kind: input.kind,
    categoryId: input.categoryId,
    stacks: { create: input.stacks.map((stackCode) => ({ stackCode })) },
    tags: { create: input.tags.map((tag) => ({ tag })) },
  };
}

function scalarPatch(patch: ProductPatch) {
  return {
    title: patch.title,
    summary: patch.summary,
    kind: patch.kind,
    categoryId: patch.categoryId,
    slug: patch.slug,
  };
}

function toRecord(row: {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  summary: string;
  kind: ProductKindName;
  categoryId: string;
  listingState: string;
  createdAt: Date;
  updatedAt: Date;
  stacks: { stackCode: string }[];
  tags: { tag: string }[];
  previews: { id: string; objectKey: string; contentType: string; byteSize: number }[];
}): ProductRecord {
  return {
    id: row.id,
    sellerId: row.sellerId,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    kind: row.kind,
    categoryId: row.categoryId,
    listingState: row.listingState,
    stacks: row.stacks.map((stack) => stack.stackCode),
    tags: row.tags.map((tag) => tag.tag),
    previews: row.previews.map((preview) => ({
      id: preview.id,
      url: mediaUrl(preview.objectKey),
      contentType: preview.contentType,
      byteSize: preview.byteSize,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapWriteError(error: unknown): unknown {
  if (isCode(error, "P2002")) {
    return new AuthFailure(409, "conflict", "That slug is already in use.");
  }
  if (isCode(error, "P2003")) {
    return new AuthFailure(400, "validation_failed", "Choose a category.");
  }
  return error;
}

function isCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function isPreviewType(value: string): value is PreviewType {
  return value === "image/png" || value === "image/jpeg" || value === "image/webp";
}
