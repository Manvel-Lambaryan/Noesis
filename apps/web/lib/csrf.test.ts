import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rejectsCrossSite } from "./csrf.ts";

describe("BFF cross-site check", () => {
  it("allows the same host and rejects a foreign origin", () => {
    const same = new Request("https://noesis.example/api/auth/login", {
      headers: { host: "noesis.example", origin: "https://noesis.example" },
    });
    const foreign = new Request("https://noesis.example/api/auth/login", {
      headers: { host: "noesis.example", origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    });
    assert.equal(rejectsCrossSite(same), false);
    assert.equal(rejectsCrossSite(foreign), true);
  });
});
