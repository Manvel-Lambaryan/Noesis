import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesView } from "./discovery-query";

describe("discovery views", () => {
  it("lists one typescript business application in both lenses with one id", () => {
    const product = { productId: "product-1", kind: "business_application", stacks: ["typescript"] };
    assert.equal(matchesView(product, "general"), true);
    assert.equal(matchesView(product, "javascript"), true);
    assert.equal(matchesView(product, "business_apps"), true);
    assert.equal(product.productId, "product-1");
  });

  it("keeps a non-javascript code asset out of the javascript and business lenses", () => {
    const product = { productId: "product-2", kind: "code_asset", stacks: ["python"] };
    assert.equal(matchesView(product, "general"), true);
    assert.equal(matchesView(product, "javascript"), false);
    assert.equal(matchesView(product, "business_apps"), false);
  });
});
