import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import type { SellerVersionAccess } from "../artifacts/artifacts.public-port";
import type { CatalogAccess, OwnedProduct } from "../catalog/catalog.public-port";
import type { PricingAccess, PublicOffer } from "../pricing/pricing.public-port";
import type { SellerAccess } from "../seller/seller.public-port";
import { WorkspaceService } from "./workspace.service";

describe("seller workspace access", () => {
  it("refuses a buyer, an admin, and a finance operator", async () => {
    const service = serviceFor();
    await assert.rejects(() => service.view(actor(["buyer"])), (error: unknown) => error instanceof AuthFailure && error.status === 403);
    await assert.rejects(() => service.view(actor(["admin"], ["moderation"])), (error: unknown) => error instanceof AuthFailure && error.status === 403);
    await assert.rejects(() => service.view(actor(["admin"], ["finance"])), (error: unknown) => error instanceof AuthFailure && error.status === 403);
  });

  it("reads only the signed-in seller id", async () => {
    const seen: string[] = [];
    const service = serviceFor(seen);
    const view = await service.view(actor(["seller"]));
    assert.deepEqual(seen, ["seller-1", "seller-1", "seller-1"]);
    assert.equal(view.seller.displayName, "Northwind");
    assert.equal(view.products[0]?.offer?.amountMinor, "2500");
    assert.equal(JSON.stringify(view).includes("privateKey"), false);
    assert.equal(JSON.stringify(view).includes("quarantine"), false);
  });
});

function serviceFor(seen: string[] = []): WorkspaceService {
  const sellers: SellerAccess = {
    saveOwnDraft: () => Promise.reject(new Error("unused")),
    getOwnProfile: (userId) => {
      seen.push(userId);
      return Promise.resolve({
        id: "profile-1",
        userId,
        displayName: "Northwind",
        verificationState: "verification_approved",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      });
    },
  };
  const catalog = {
    listForIndex: () => Promise.resolve([]),
    findOwned: () => Promise.resolve(null),
    listOwned: (sellerId: string) => {
      seen.push(sellerId);
      const product: OwnedProduct = {
        id: "product-1",
        slug: "starter",
        title: "Starter",
        kind: "code_asset",
        listingState: "published",
        hasPreview: true,
        previewUrl: null,
        stacks: ["typescript"],
        createdAt: new Date("2026-02-02T00:00:00.000Z"),
        updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      };
      return Promise.resolve([product]);
    },
  } satisfies CatalogAccess;
  const versions: SellerVersionAccess = {
    listForSeller: (sellerId) => {
      seen.push(sellerId);
      return Promise.resolve([]);
    },
  };
  const pricing: PricingAccess = {
    activeQuotes: () => {
      const offer: PublicOffer = { offerId: "offer-1", amountMinor: "2500", currency: "USD", licenseCode: null, updatePolicy: null, demoUrl: null };
      return Promise.resolve(new Map([["product-1", offer]]));
    },
    snapshot: () => Promise.resolve(null),
  };
  return new WorkspaceService(sellers, catalog, versions, pricing);
}

function actor(roles: Actor["roles"], permissions: Actor["permissions"] = []): Actor {
  return {
    userId: "seller-1",
    email: "seller@example.com",
    givenName: "Nora",
    familyName: "Petrosyan",
    roles,
    permissions,
    emailVerified: true,
  };
}
