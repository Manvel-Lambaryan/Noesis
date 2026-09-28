import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "./password-hasher";

describe("argon2id passwords", () => {
  it("stores an Argon2id hash that rejects a different password", async () => {
    const stored = await hashPassword("correct-horse-1");
    assert.match(stored, /^\$argon2id\$/);
    assert.equal(await verifyPassword(stored, "correct-horse-1"), true);
    assert.equal(await verifyPassword(stored, "correct-horse-2"), false);
  });
});
