import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "../infrastructure/identity/token-hash";
import { api, isRecord, startAuthApp, tokenFromMailbox } from "./auth-test-client";

const PASSWORD = "correct-horse-1";
const NEXT_PASSWORD = "correct-horse-2";
const lines: string[] = [];
const originalWrite = process.stdout.write.bind(process.stdout);
let baseUrl = "";
let closeApp: () => Promise<void> = async () => undefined;
const prisma = new PrismaClient();

describe("identity", () => {
  before(async () => {
    process.stdout.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding, cb?: (error?: Error | null) => void) => {
      lines.push(String(chunk));
      return originalWrite(chunk, encoding, cb);
    }) as typeof process.stdout.write;
    const started = await startAuthApp();
    baseUrl = started.baseUrl;
    closeApp = started.close;
  });

  after(async () => {
    process.stdout.write = originalWrite;
    await closeApp();
    await prisma.$disconnect();
  });

  it("registers, verifies once, and applies the purchase gate", async () => {
    const email = uniqueEmail("buyer");
    const created = await api(baseUrl, "POST", "/v1/auth/register", { email, password: PASSWORD });
    assert.equal(created.status, 201);
    const sessionBefore = await sessionOf(email, PASSWORD);
    assert.equal(gate(sessionBefore, "purchase"), "email_unverified");
    const token = await latestToken("email_verification");
    assert.equal((await api(baseUrl, "POST", "/v1/auth/email-verifications", { token })).status, 204);
    assert.equal((await api(baseUrl, "POST", "/v1/auth/email-verifications", { token })).status, 400);
    const sessionAfter = await sessionOf(email, PASSWORD);
    assert.equal(gate(sessionAfter, "purchase"), true);
    assert.equal(lines.join("").includes(PASSWORD), false);
    assert.equal(lines.join("").includes(token), false);
  });

  it("rejects invalid credentials without a different message", async () => {
    const email = uniqueEmail("missing");
    const unknown = await api(baseUrl, "POST", "/v1/auth/login", { email, password: PASSWORD });
    const known = await api(baseUrl, "POST", "/v1/auth/register", { email, password: PASSWORD });
    assert.equal(known.status, 201);
    const wrong = await api(baseUrl, "POST", "/v1/auth/login", { email, password: "not-the-password" });
    assert.equal(unknown.status, 401);
    assert.equal(wrong.status, 401);
    assert.equal(message(unknown), message(wrong));
  });

  it("resets a password once and revokes the old session", async () => {
    const email = uniqueEmail("reset");
    await api(baseUrl, "POST", "/v1/auth/register", { email, password: PASSWORD });
    const first = await login(email, PASSWORD);
    const token = first.sessionToken;
    assert.equal((await api(baseUrl, "POST", "/v1/auth/password-resets", { email })).status, 202);
    const resetToken = await latestToken("password_reset");
    assert.equal((await api(baseUrl, "POST", "/v1/auth/password-resets", { token: resetToken, password: NEXT_PASSWORD })).status, 204);
    assert.equal((await api(baseUrl, "POST", "/v1/auth/password-resets", { token: resetToken, password: NEXT_PASSWORD })).status, 400);
    assert.equal((await api(baseUrl, "GET", "/v1/auth/session", undefined, { "x-session-id": token })).status, 401);
    assert.equal((await login(email, PASSWORD)).status, 401);
    assert.equal((await login(email, NEXT_PASSWORD)).status, 200);
  });

  it("expires and revokes sessions", async () => {
    const email = uniqueEmail("session");
    await api(baseUrl, "POST", "/v1/auth/register", { email, password: PASSWORD });
    const opened = await login(email, PASSWORD);
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(opened.sessionToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    assert.equal((await api(baseUrl, "GET", "/v1/auth/session", undefined, { "x-session-id": opened.sessionToken })).status, 401);
    const fresh = await login(email, PASSWORD);
    assert.equal((await api(baseUrl, "POST", "/v1/auth/logout", undefined, { "x-session-id": fresh.sessionToken })).status, 204);
    assert.equal((await api(baseUrl, "GET", "/v1/auth/session", undefined, { "x-session-id": fresh.sessionToken })).status, 401);
  });

  it("denies buyers admin routes and separates finance from moderation", async () => {
    const buyer = await account("buyer-admin");
    assert.equal((await api(baseUrl, "GET", "/v1/admin/moderation/queue", undefined, sessionHeader(buyer))).status, 403);
    const moderator = await account("moderator");
    await grant(moderator.userId, "moderation");
    const moderatorSession = await login(moderator.email, PASSWORD);
    assert.equal((await api(baseUrl, "GET", "/v1/admin/moderation/queue", undefined, sessionHeader(moderatorSession))).status, 200);
    assert.equal((await api(baseUrl, "POST", "/v1/admin/payouts/payout-1/hold", {}, sessionHeader(moderatorSession))).status, 403);
    const finance = await account("finance");
    await grant(finance.userId, "finance");
    const financeSession = await login(finance.email, PASSWORD);
    assert.equal((await api(baseUrl, "GET", "/v1/admin/moderation/queue", undefined, sessionHeader(financeSession))).status, 403);
    assert.equal((await api(baseUrl, "POST", "/v1/admin/payouts/payout-1/hold", {}, sessionHeader(financeSession))).status, 501);
  });

  it("keeps seller drafts private to the owner and blocks publish until identity verification", async () => {
    const owner = await verifiedAccount("owner");
    const other = await verifiedAccount("other");
    const saved = await api(baseUrl, "PUT", "/v1/seller/profile", { displayName: "Owner Studio", userId: other.userId }, sessionHeader(owner));
    assert.equal(saved.status, 200);
    assert.equal((await api(baseUrl, "GET", "/v1/seller/profile", undefined, sessionHeader(other))).status, 404);
    const ownerView = await api(baseUrl, "GET", "/v1/auth/session", undefined, sessionHeader(owner));
    assert.equal(gate(ownerView, "sellerPublish"), "seller_not_verified");
    await prisma.sellerProfile.update({ where: { userId: owner.userId }, data: { verificationState: "verification_approved" } });
    const approved = await api(baseUrl, "GET", "/v1/auth/session", undefined, sessionHeader(await login(owner.email, PASSWORD)));
    assert.equal(gate(approved, "sellerPublish"), true);
    const otherSaved = await api(baseUrl, "PUT", "/v1/seller/profile", { displayName: "Other Studio" }, sessionHeader(other));
    assert.equal(otherSaved.status, 200);
    const ownerStill = await api(baseUrl, "GET", "/v1/seller/profile", undefined, sessionHeader(owner));
    assert.equal(isRecord(ownerStill.body) && ownerStill.body.displayName, "Owner Studio");
  });

  it("rate limits login and password reset", async () => {
    const email = uniqueEmail("limit");
    const loginIp = { "x-client-ip": "203.0.113.50" };
    process.env.AUTH_LOGIN_MAX = "2";
    const attempts = [
      await api(baseUrl, "POST", "/v1/auth/login", { email, password: PASSWORD }, loginIp),
      await api(baseUrl, "POST", "/v1/auth/login", { email, password: PASSWORD }, loginIp),
      await api(baseUrl, "POST", "/v1/auth/login", { email, password: PASSWORD }, loginIp),
    ];
    delete process.env.AUTH_LOGIN_MAX;
    const resetIp = { "x-client-ip": "203.0.113.51" };
    process.env.AUTH_RESET_MAX = "2";
    const resets = [
      await api(baseUrl, "POST", "/v1/auth/password-resets", { email }, resetIp),
      await api(baseUrl, "POST", "/v1/auth/password-resets", { email }, resetIp),
      await api(baseUrl, "POST", "/v1/auth/password-resets", { email }, resetIp),
    ];
    delete process.env.AUTH_RESET_MAX;
    assert.deepEqual(attempts.map((item) => item.status), [401, 401, 429]);
    assert.deepEqual(resets.map((item) => item.status), [202, 202, 429]);
  });

  it("rejects a caller that does not present the BFF token", async () => {
    const response = await fetch(`${baseUrl}/v1/auth/session`);
    assert.equal(response.status, 401);
  });

  it("publishes the auth paths", async () => {
    const document = await api(baseUrl, "GET", "/docs-json");
    assert.equal(document.status, 200);
    assert.equal(isRecord(document.body) && isRecord(document.body.paths) && "/v1/auth/session" in document.body.paths, true);
  });
});

function uniqueEmail(label: string): string {
  return `${label}-${crypto.randomUUID()}@example.com`;
}

async function login(email: string, password: string): Promise<{ status: number; sessionToken: string; userId: string; email: string }> {
  const result = await api(baseUrl, "POST", "/v1/auth/login", { email, password });
  const actor = isRecord(result.body) && isRecord(result.body.actor) ? result.body.actor : {};
  return {
    status: result.status,
    sessionToken: isRecord(result.body) && typeof result.body.sessionToken === "string" ? result.body.sessionToken : "",
    userId: typeof actor.userId === "string" ? actor.userId : "",
    email,
  };
}

async function sessionOf(email: string, password: string): Promise<{ status: number; body: unknown }> {
  const opened = await login(email, password);
  return api(baseUrl, "GET", "/v1/auth/session", undefined, { "x-session-id": opened.sessionToken });
}

async function latestToken(purpose: string): Promise<string> {
  const mailbox = await api(baseUrl, "GET", "/v1/auth/mailbox");
  return tokenFromMailbox(mailbox.body, purpose);
}

async function account(label: string): Promise<{ userId: string; email: string; sessionToken: string }> {
  const email = uniqueEmail(label);
  const created = await api(baseUrl, "POST", "/v1/auth/register", { email, password: PASSWORD });
  const userId = isRecord(created.body) && typeof created.body.userId === "string" ? created.body.userId : "";
  const opened = await login(email, PASSWORD);
  return { userId, email, sessionToken: opened.sessionToken };
}

async function verifiedAccount(label: string): Promise<{ userId: string; email: string; sessionToken: string }> {
  const created = await account(label);
  const token = await latestToken("email_verification");
  await api(baseUrl, "POST", "/v1/auth/email-verifications", { token });
  const opened = await login(created.email, PASSWORD);
  return { ...created, sessionToken: opened.sessionToken };
}

async function grant(userId: string, permission: "moderation" | "finance"): Promise<void> {
  await prisma.roleAssignment.create({ data: { userId, role: "admin" } });
  await prisma.adminPermission.create({ data: { userId, permission } });
}

function sessionHeader(value: { sessionToken: string }): Record<string, string> {
  return { "x-session-id": value.sessionToken };
}

function gate(result: { body: unknown }, name: "purchase" | "sellerPublish"): boolean | string {
  if (!isRecord(result.body) || !isRecord(result.body.gates) || !isRecord(result.body.gates[name])) {
    return "missing";
  }
  const value = result.body.gates[name];
  return value.allowed === true ? true : typeof value.reason === "string" ? value.reason : "missing";
}

function message(result: { body: unknown }): string {
  return isRecord(result.body) && typeof result.body.message === "string" ? result.body.message : "";
}
