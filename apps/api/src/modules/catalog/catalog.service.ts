import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Logger } from "@noesis/kernel";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import { API_LOGGER } from "../../health/health.controller";
import { ProductRateLimit } from "../../infrastructure/catalog/product-rate-limit";
import { type CatalogAccess, type CategoryView } from "./catalog.public-port";
import { CATALOG_REPOSITORY, type CatalogRepository, type ProductRecord } from "./catalog.repository";
import {
  missingProduct,
  parseCategoryId,
  parseProductId,
  parseKind,
  parseSlug,
  parseStacks,
  parseSummary,
  parseTags,
  parseTitle,
  slugFromTitle,
} from "./product-policy";

@Injectable()
export class CatalogService implements CatalogAccess {
  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly products: CatalogRepository,
    private readonly limits: ProductRateLimit,
    @Inject(API_LOGGER) private readonly logger: Logger,
  ) {}

  listForIndex() {
    return this.products.listForIndex();
  }

  listCategories(): Promise<CategoryView[]> {
    return this.products.listActiveCategories();
  }

  async listOwn(actor: Actor): Promise<ProductRecord[]> {
    requireSeller(actor);
    return this.products.listBySeller(actor.userId);
  }

  async getOwn(actor: Actor, productId: string): Promise<ProductRecord> {
    return this.ownedDraft(actor, productId);
  }

  // Drafts stay private. Publication must call sellerPublishGate in a later slice.
  async create(actor: Actor, body: Record<string, unknown>, ip: string, correlationId: string): Promise<ProductRecord> {
    requireSeller(actor);
    await this.limits.assertCreateAllowed(actor.userId, ip);
    const draft = await this.draftInput(body);
    const created = await this.products.create(draft(actor.userId));
    this.logger.info({ message: "product draft", correlationId, status: "ok" });
    return created;
  }

  async update(actor: Actor, productId: string, body: Record<string, unknown>): Promise<ProductRecord> {
    await this.ownedDraft(actor, productId);
    if (body.categoryId !== undefined && !(await this.products.categoryExists(parseCategoryId(body.categoryId)))) {
      throw new AuthFailure(400, "validation_failed", "Choose a category.");
    }
    const updated = await this.products.updateDraft(productId, {
      title: body.title === undefined ? undefined : parseTitle(body.title),
      summary: body.summary === undefined ? undefined : parseSummary(body.summary),
      kind: body.kind === undefined ? undefined : parseKind(body.kind),
      categoryId: body.categoryId === undefined ? undefined : parseCategoryId(body.categoryId),
      slug: parseSlug(body.slug),
      stacks: parseStacks(body.stacks),
      tags: parseTags(body.tags),
    });
    return updated ?? missingThrow();
  }

  private async draftInput(body: Record<string, unknown>): Promise<(sellerId: string) => Parameters<CatalogRepository["create"]>[0]> {
    const title = parseTitle(body.title);
    const categoryId = parseCategoryId(body.categoryId);
    if (!(await this.products.categoryExists(categoryId))) {
      throw new AuthFailure(400, "validation_failed", "Choose a category.");
    }
    const kind = parseKind(body.kind);
    const summary = parseSummary(body.summary);
    const stacks = parseStacks(body.stacks) ?? [];
    const tags = parseTags(body.tags) ?? [];
    const slug = parseSlug(body.slug);
    return (sellerId: string) => {
      const id = randomUUID();
      return { id, sellerId, slug: slug ?? slugFromTitle(title, id), title, summary, kind, categoryId, stacks, tags };
    };
  }

  private async ownedDraft(actor: Actor, productId: string): Promise<ProductRecord> {
    requireSeller(actor);
    const product = await this.products.findById(parseProductId(productId));
    if (product === null || product.sellerId !== actor.userId) {
      throw missingProduct();
    }
    if (product.listingState !== "draft") {
      throw new AuthFailure(409, "conflict", "Only drafts can be edited in this slice.");
    }
    return product;
  }
}

function requireSeller(actor: Actor): void {
  if (!actor.roles.includes("seller")) {
    throw new AuthFailure(403, "forbidden", "Seller role required.");
  }
}

function missingThrow(): never {
  throw missingProduct();
}
