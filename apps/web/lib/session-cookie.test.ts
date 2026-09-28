import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sessionCookie, SESSION_COOKIE } from "./session-cookie.ts";

describe("session cookie", () => {
  it("is an HttpOnly host cookie with no domain attribute", () => {
    const cookie = sessionCookie("opaque-token", 60);
    assert.equal(cookie.name, SESSION_COOKIE);
    assert.equal(cookie.name.startsWith("__Host-"), true);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.secure, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.path, "/");
    assert.equal("domain" in cookie, false);
    assert.equal(cookie.value.includes("."), false);
  });
});
