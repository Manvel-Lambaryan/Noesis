import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAmountMinor, parseCurrency, parseDemoUrl, parseUpdatePolicy } from "./offer-policy";

describe("offer terms", () => {
  it("accepts integer minor units and rejects fractions", () => {
    assert.equal(parseAmountMinor(1999), 1999n);
    assert.equal(parseAmountMinor("1999"), 1999n);
    assert.throws(() => parseAmountMinor(10.5), /minor units/);
    assert.throws(() => parseAmountMinor("10.00"), /minor units/);
    assert.throws(() => parseAmountMinor(0), /minor units/);
    assert.throws(() => parseAmountMinor(-5), /minor units/);
  });

  it("normalizes a 3-letter currency and rejects other shapes", () => {
    assert.equal(parseCurrency("usd"), "USD");
    assert.throws(() => parseCurrency("US"), /3-letter/);
    assert.throws(() => parseCurrency("U1D"), /3-letter/);
  });

  it("stores only the documented update policies", () => {
    assert.equal(parseUpdatePolicy(""), null);
    assert.equal(parseUpdatePolicy("exact_version"), "exact_version");
    assert.throws(() => parseUpdatePolicy("lifetime"), /Update policy/);
  });

  it("keeps demo links external and without credentials", () => {
    assert.equal(parseDemoUrl("https://example.com/demo"), "https://example.com/demo");
    assert.equal(parseDemoUrl(""), null);
    assert.throws(() => parseDemoUrl("javascript:alert(1)"), /http or https/);
    assert.throws(() => parseDemoUrl("https://user:secret@example.com/demo"), /credentials/);
  });
});
