import { Inject, Injectable } from "@nestjs/common";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import { SELLER_VERSIONS, type SellerVersionAccess } from "../artifacts/artifacts.public-port";
import { CATALOG_ACCESS, type CatalogAccess, type OwnedProduct } from "../catalog/catalog.public-port";
import { PRICING_ACCESS, type PricingAccess } from "../pricing/pricing.public-port";
import { SELLER_ACCESS, type SellerAccess } from "../seller/seller.public-port";
import type { WorkspaceInput, WorkspaceView } from "./workspace-model";
import { buildWorkspace } from "./workspace-summary";

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(SELLER_ACCESS) private readonly sellers: SellerAccess,
    @Inject(CATALOG_ACCESS) private readonly catalog: CatalogAccess,
    @Inject(SELLER_VERSIONS) private readonly versions: SellerVersionAccess,
    @Inject(PRICING_ACCESS) private readonly pricing: PricingAccess,
  ) {}

  async view(actor: Actor): Promise<WorkspaceView> {
    if (!actor.roles.includes("seller")) {
      throw new AuthFailure(403, "forbidden", "Seller role required.");
    }
    const [profile, products, versions] = await Promise.all([
      this.sellers.getOwnProfile(actor.userId),
      this.catalog.listOwned(actor.userId),
      this.versions.listForSeller(actor.userId),
    ]);
    const quotes = await this.pricing.activeQuotes(products.map((product) => product.id));
    return buildWorkspace(toInput(actor.emailVerified, profile, products, versions, quotes));
  }
}

function toInput(
  emailVerified: boolean,
  profile: Awaited<ReturnType<SellerAccess["getOwnProfile"]>>,
  products: OwnedProduct[],
  versions: Awaited<ReturnType<SellerVersionAccess["listForSeller"]>>,
  quotes: Awaited<ReturnType<PricingAccess["activeQuotes"]>>,
): WorkspaceInput {
  return {
    emailVerified,
    profile: profile === null ? null : {
      displayName: profile.displayName,
      verificationState: profile.verificationState,
      createdAt: profile.createdAt.toISOString(),
    },
    products: products.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })),
    versions: versions.map((version) => ({
      ...version,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    })),
    offers: [...quotes.entries()].map(([productId, offer]) => ({
      productId,
      amountMinor: offer.amountMinor,
      currency: offer.currency,
    })),
  };
}
