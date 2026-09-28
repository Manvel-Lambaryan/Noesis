import { Inject, Injectable } from "@nestjs/common";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import { OfferRateLimit } from "../../infrastructure/pricing/offer-rate-limit";
import { OfferStore, type StoredOffer } from "../../infrastructure/pricing/offer-store";
import { SELLABILITY, type Sellability } from "../artifacts/artifacts.public-port";
import { CATALOG_ACCESS, type CatalogAccess } from "../catalog/catalog.public-port";
import { parseOfferDraft } from "./offer-policy";
import type { OfferSnapshot, PricingAccess, PublicOffer } from "./pricing.public-port";

@Injectable()
export class PricingService implements PricingAccess {
  constructor(
    private readonly offers: OfferStore,
    private readonly limits: OfferRateLimit,
    @Inject(CATALOG_ACCESS) private readonly catalog: CatalogAccess,
    @Inject(SELLABILITY) private readonly sellability: Sellability,
  ) {}

  async activeQuotes(productIds: readonly string[]): Promise<ReadonlyMap<string, PublicOffer>> {
    const rows = await this.offers.activeForProducts(productIds);
    return new Map(rows.map((row) => [row.productId, publicOffer(row)]));
  }

  async snapshot(offerId: string): Promise<OfferSnapshot | null> {
    const row = await this.offers.findAny(offerId);
    return row === null ? null : present(row);
  }

  async list(actor: Actor, productId: string): Promise<{ offers: OfferSnapshot[] }> {
    const id = await this.owned(actor, productId);
    const rows = await this.offers.listForProduct(id, actor.userId);
    return { offers: rows.map(present) };
  }

  async create(actor: Actor, productId: string, body: Record<string, unknown>, ip: string): Promise<OfferSnapshot> {
    requireSeller(actor);
    const draft = parseOfferDraft(body);
    const id = await this.owned(actor, productId);
    const sellable = await this.sellability.isSellableVersion(id, draft.versionId);
    if (!sellable) {
      throw new AuthFailure(409, "not_sellable", "An offer can pin only an approved version in private storage.");
    }
    await this.limits.assertCreateAllowed(actor.userId, ip);
    try {
      return present(await this.offers.replaceActive({ ...draft, productId: id, sellerId: actor.userId }));
    } catch (error) {
      if (duplicate(error)) {
        throw new AuthFailure(409, "conflict", "Another offer was activated at the same time. Try again.");
      }
      throw error;
    }
  }

  async archive(actor: Actor, offerId: string): Promise<{ state: "archived" }> {
    requireSeller(actor);
    const result = await this.offers.archive(offerId, actor.userId);
    if (result === "missing") {
      throw new AuthFailure(404, "not_found", "That offer was not found.");
    }
    if (result === "conflict") {
      throw new AuthFailure(409, "conflict", "Only an active offer can be archived.");
    }
    return { state: "archived" };
  }

  private async owned(actor: Actor, productId: string): Promise<string> {
    requireSeller(actor);
    if (!/^[0-9a-f-]{36}$/i.test(productId)) {
      throw new AuthFailure(404, "not_found", "Product not found.");
    }
    const id = productId.toLowerCase();
    const product = await this.catalog.findOwned(actor.userId, id);
    if (product === null) {
      throw new AuthFailure(404, "not_found", "Product not found.");
    }
    return id;
  }
}

function publicOffer(row: StoredOffer): PublicOffer {
  return {
    offerId: row.id,
    amountMinor: row.amountMinor.toString(),
    currency: row.currency.trim(),
    licenseCode: row.licenseCode,
    updatePolicy: row.updatePolicy,
    demoUrl: row.demoUrl,
  };
}

function present(row: StoredOffer): OfferSnapshot {
  return {
    ...publicOffer(row),
    productId: row.productId,
    versionId: row.versionId,
    licenseTextId: row.licenseTextId,
    state: row.state,
    createdAt: row.createdAt.toISOString(),
  };
}

function requireSeller(actor: Actor): void {
  if (!actor.roles.includes("seller")) {
    throw new AuthFailure(403, "forbidden", "Seller role required.");
  }
}

function duplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
