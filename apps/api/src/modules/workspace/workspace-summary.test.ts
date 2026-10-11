import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UNAVAILABLE_METRICS, type WorkspaceInput } from "./workspace-model";
import { buildWorkspace } from "./workspace-summary";

const NOW = "2026-10-07T08:00:00.000Z";
const EARLIER = "2026-10-01T08:00:00.000Z";

describe("seller workspace summary", () => {
  it("keeps commerce, finance, and analytics unavailable", () => {
    const view = buildWorkspace(base());
    assert.deepEqual(view.unavailable, [...UNAVAILABLE_METRICS]);
    assert.equal(view.checks.payout, "unavailable");
    assert.equal(JSON.stringify(view).includes("12450"), false);
  });

  it("asks an unverified seller to verify email and identity", () => {
    const view = buildWorkspace(base());
    assert.equal(view.checks.email, "requires_action");
    assert.equal(view.checks.seller, "not_started");
    assert.deepEqual(view.attention.map((item) => item.id), ["email", "seller-incomplete"]);
    assert.equal(view.metrics.totalProducts, 0);
  });

  it("flags a published product that has no active offer", () => {
    const view = buildWorkspace(base({
      emailVerified: true,
      profile: { displayName: "Northwind", verificationState: "verification_approved", createdAt: EARLIER },
      products: [product({ listingState: "published" })],
      versions: [version({ state: "approved" })],
    }));
    assert.equal(view.checks.seller, "approved");
    assert.equal(view.metrics.publishedProducts, 1);
    assert.deepEqual(view.attention.map((item) => item.id), ["price:product-1"]);
    assert.equal(view.products[0]?.offer, null);
  });

  it("flags an approved draft that has no offer, and a scan rejection with its code", () => {
    const view = buildWorkspace(base({
      emailVerified: true,
      profile: { displayName: "Northwind", verificationState: "verification_approved", createdAt: EARLIER },
      products: [product({ id: "product-1" }), product({ id: "product-2", title: "Kit" })],
      versions: [
        version({ state: "approved" }),
        version({ id: "version-2", productId: "product-2", state: "scan_rejected", reasonCode: "malware" }),
      ],
    }));
    assert.equal(view.attention.some((item) => item.id === "offer:product-1"), true);
    assert.equal(view.attention.some((item) => item.id === "scan:version-2" && item.detail.includes("malware")), true);
    assert.equal(view.metrics.needsAction, 1);
  });

  it("does not treat a moderator code as the written rejection note", () => {
    const view = buildWorkspace(base({
      emailVerified: true,
      profile: { displayName: "Northwind", verificationState: "verification_approved", createdAt: EARLIER },
      products: [product({})],
      versions: [version({ state: "rejected", reasonCode: "moderator_rejected" })],
    }));
    const note = view.attention.find((item) => item.id === "rejected:version-1");
    assert.equal(note?.detail.includes("moderator_rejected"), false);
    assert.equal(view.activity.some((item) => item.event === "Version rejected"), true);
  });

  it("counts review separately from drafts and orders activity by time", () => {
    const view = buildWorkspace(base({
      emailVerified: true,
      profile: { displayName: "Northwind", verificationState: "verification_submitted", createdAt: EARLIER },
      products: [product({ createdAt: EARLIER, updatedAt: NOW })],
      versions: [version({ state: "pending_moderation", updatedAt: NOW })],
    }));
    assert.equal(view.metrics.drafts, 1);
    assert.equal(view.metrics.underReview, 1);
    assert.equal(view.activity[0]?.at, NOW);
    assert.equal(view.checks.seller, "pending");
  });
});

function base(patch: Partial<WorkspaceInput> = {}): WorkspaceInput {
  return {
    emailVerified: false,
    profile: { displayName: "Draft", verificationState: "draft", createdAt: EARLIER },
    products: [],
    versions: [],
    offers: [],
    ...patch,
  };
}

function product(patch: Partial<WorkspaceInput["products"][number]>): WorkspaceInput["products"][number] {
  return {
    id: "product-1",
    slug: "starter",
    title: "Starter",
    kind: "code_asset",
    listingState: "draft",
    hasPreview: false,
    previewUrl: null,
    stacks: ["typescript"],
    createdAt: EARLIER,
    updatedAt: EARLIER,
    ...patch,
  };
}

function version(patch: Partial<WorkspaceInput["versions"][number]>): WorkspaceInput["versions"][number] {
  return {
    id: "version-1",
    productId: "product-1",
    versionLabel: "1.0.0",
    state: "draft",
    reasonCode: null,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    ...patch,
  };
}
