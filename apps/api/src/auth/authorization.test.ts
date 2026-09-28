import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Actor } from "./actor";
import { purchaseGate, sellerPublishGate } from "./authorization";

const buyer = (emailVerified: boolean): Actor => ({
  userId: "user",
  email: "buyer@example.com",
  roles: ["buyer"],
  permissions: [],
  emailVerified,
});

describe("Q19 authorization gates", () => {
  it("lets an unverified buyer browse but not purchase", () => {
    const gate = purchaseGate(buyer(false));
    assert.deepEqual(gate, { allowed: false, reason: "email_unverified" });
  });

  it("lets a verified buyer pass the purchase gate", () => {
    assert.deepEqual(purchaseGate(buyer(true)), { allowed: true });
  });

  it("blocks seller publication until email and identity are approved", () => {
    const seller: Actor = { ...buyer(true), roles: ["buyer", "seller"] };
    assert.equal(sellerPublishGate(seller, "draft").allowed, false);
    assert.equal(sellerPublishGate({ ...seller, emailVerified: false }, "verification_approved").allowed, false);
    assert.deepEqual(sellerPublishGate(seller, "verification_approved"), { allowed: true });
  });
});
