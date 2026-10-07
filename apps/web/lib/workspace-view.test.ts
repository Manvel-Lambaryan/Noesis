import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { badgeFor, catalogTitle, linkActive, navCounts, workspaceTitle } from "./workspace-nav.ts";
import { catalogQuery, filterCatalog, minorMoney, parseWorkspace, type ProductRow, type WorkspaceView } from "./workspace-view.ts";

describe("seller workspace view", () => {
  it("rejects a payload that invents revenue", () => {
    const body = sample();
    body.unavailable = ["sales"];
    assert.equal(parseWorkspace(body), null);
    body.unavailable = ["sales", "revenue", "views", "availableBalance", "pendingPayout"];
    body.metrics = { ...body.metrics, totalProducts: 1.5 };
    assert.equal(parseWorkspace(body), null);
  });

  it("accepts an empty seller workspace", () => {
    const view = parseWorkspace(sample());
    assert.equal(view?.metrics.totalProducts, 0);
    assert.equal(view?.checks.payout, "unavailable");
    assert.equal(view?.attention[0]?.href, "/verify-email");
  });

  it("filters the catalog by real listing and version state", () => {
    const rows = [row("draft", null), row("published", "pending_moderation"), row("taken_down", "rejected")];
    assert.equal(filterCatalog(rows, catalogQuery({ listing: "draft" })).length, 1);
    assert.equal(filterCatalog(rows, catalogQuery({ queue: "review" }))[0]?.id, "published");
    assert.equal(filterCatalog(rows, catalogQuery({ queue: "attention" }))[0]?.id, "taken_down");
    assert.equal(filterCatalog(rows, catalogQuery({ queue: "rejected" }))[0]?.id, "taken_down");
    assert.equal(filterCatalog(rows, catalogQuery({ listing: "<script>" })).length, 3);
    assert.equal(navCounts(rows).rejected, 1);
    assert.equal(badgeFor("/account/products?queue=rejected", navCounts(rows)), 1);
    assert.equal(badgeFor("/account/sales", navCounts(rows)), null);
  });

  it("defaults missing preview fields and rejects a bad stack list", () => {
    const legacy = { ...sample(), products: [{ ...row("legacy", null), previewUrl: undefined, stacks: undefined }] } as unknown;
    const parsed = parseWorkspace(legacy);
    assert.equal(parsed?.products[0]?.previewUrl, null);
    assert.equal(parsed?.products[0]?.stacks.length, 0);
    const broken = { ...sample(), products: [{ ...row("broken", null), stacks: [1] }] } as unknown;
    assert.equal(parseWorkspace(broken), null);
  });

  it("names routes and marks the current workspace link", () => {
    assert.equal(workspaceTitle("/account/finance/payouts"), "Finance");
    assert.equal(catalogTitle({ queue: "attention" }), "Needs action");
    assert.equal(catalogTitle({ queue: "rejected" }), "Rejected");
    assert.equal(linkActive("/account", "/account/products", ""), false);
    assert.equal(linkActive("/account/products?listing=draft", "/account/products", "listing=draft"), true);
    assert.equal(linkActive("/account/products", "/account/products/abc", ""), true);
    assert.equal(linkActive("/account/finance", "/account/finance/payouts", ""), false);
    assert.equal(minorMoney("2500", "USD"), "2500 USD minor");
    assert.equal(minorMoney("12.5", "USD"), "Unavailable");
  });
});

function sample(): WorkspaceView {
  return {
    seller: { displayName: "Northwind", verificationState: "draft", memberSince: null },
    checks: { email: "requires_action", seller: "not_started", payout: "unavailable" },
    metrics: { totalProducts: 0, publishedProducts: 0, underReview: 0, drafts: 0, needsAction: 0 },
    unavailable: ["sales", "revenue", "views", "availableBalance", "pendingPayout"],
    attention: [{ id: "email", severity: "blocked", title: "Email", detail: "Verify", href: "/verify-email" }],
    products: [],
    productsCapped: false,
    versionsCapped: false,
    activity: [],
  };
}

function row(id: string, versionState: string | null): ProductRow {
  return {
    id,
    slug: id,
    title: id,
    kind: "code_asset",
    listingState: id,
    hasPreview: false,
    previewUrl: null,
    stacks: [],
    versionLabel: versionState === null ? null : "1.0.0",
    versionState,
    offer: null,
    updatedAt: "2026-10-07T08:00:00.000Z",
  };
}
