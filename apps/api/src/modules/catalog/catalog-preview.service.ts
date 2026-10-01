import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import { PUBLIC_STORAGE, type PublicObjectStorage } from "../../infrastructure/storage/local-public-storage";
import { CATALOG_REPOSITORY, type CatalogRepository, type PreviewView } from "./catalog.repository";
import { decodePreview, extensionFor, parsePreviewDeclaration, previewObjectKey } from "./preview-bytes";
import { missingProduct, parseProductId } from "./product-policy";

const MAX_PREVIEWS = 8;
const INTENT_MS = 15 * 60 * 1000;

@Injectable()
export class CatalogPreviewService {
  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly products: CatalogRepository,
    @Inject(PUBLIC_STORAGE) private readonly storage: PublicObjectStorage,
  ) {}

  async createIntent(actor: Actor, productId: string, body: Record<string, unknown>) {
    const product = await this.ownedDraft(actor, productId);
    const declaration = parsePreviewDeclaration(body.contentType, body.byteSize);
    if (await this.products.countPreviews(product.id) >= MAX_PREVIEWS) {
      throw new AuthFailure(400, "validation_failed", "A product can have at most 8 preview images.");
    }
    const intentId = randomUUID();
    const expiresAt = new Date(Date.now() + INTENT_MS);
    await this.products.createIntent(intentId, product.id, declaration.contentType, declaration.byteSize, expiresAt);
    return { intentId, expiresAt: expiresAt.toISOString() };
  }

  async store(actor: Actor, productId: string, body: Record<string, unknown>): Promise<PreviewView> {
    const product = await this.ownedDraft(actor, productId);
    const intent = await this.products.takeIntent(parseIntentId(body.intentId), product.id, new Date());
    if (intent === null) {
      throw new AuthFailure(400, "validation_failed", "This upload link is invalid or has already been used.");
    }
    const bytes = decodePreview(body.dataBase64, intent.byteSize, intent.contentType);
    const imageId = randomUUID();
    const key = previewObjectKey(actor.userId, product.id, imageId, extensionFor(intent.contentType));
    await this.storage.putPreview(key, bytes);
    return this.products.addPreview(imageId, product.id, key, intent.contentType, bytes.length);
  }

  private async ownedDraft(actor: Actor, productId: string) {
    if (!actor.roles.includes("seller")) {
      throw new AuthFailure(403, "forbidden", "Seller role required.");
    }
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

function parseIntentId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AuthFailure(400, "validation_failed", "This upload link is invalid or has already been used.");
  }
  return value;
}
