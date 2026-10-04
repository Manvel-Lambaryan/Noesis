import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { tmpdir } from "node:os";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { api, isRecord, startAuthApp } from "../auth/auth-test-client";

const load = createRequire(__filename);
const prisma = new PrismaClient();
const UI = "a1000000-0000-4000-8000-000000000001";
const limits = { maxBytes: 100_000, maxUncompressed: 1_000, maxEntries: 3, maxRatio: 100 };
const TEXT = "b1000000-0000-4000-8000-000000000001";
const { storedZip } = load(scanDist("zip-fixture.js")) as { storedZip: (files: { name: string; data: Buffer }[]) => Buffer };
const { prepareVersion } = load(workerDist("prepare-version.js")) as { prepareVersion: (id: string) => Promise<void> };
const { applyVerdict } = load(workerDist("apply-verdict.js")) as {
  applyVerdict: (job: { versionId: string; verdict: "pass"; reasonCode: string; sha256: string }) => Promise<unknown>;
};
const { scanObject } = load(scanDist("scan-job.js")) as {
  scanObject: (job: { versionId: string; objectKey: string; byteSize: number; sha256: string }, dir: string, archiveLimits: typeof limits) => Promise<{ versionId: string; verdict: "pass" | "fail"; reasonCode: string; sha256: string }>;
};
const { promoteVersion } = load(workerDist("promote-version.js")) as { promoteVersion: (id: string) => Promise<string> };

describe("pricing offers", { concurrency: 1 }, () => {
  let baseUrl = "";
  let stamp = "";
  let close = async (): Promise<void> => {};

  before(async () => {
    stamp = Date.now().toString(36);
    process.env.QUARANTINE_DIR = mkdtempSync(path.join(tmpdir(), "noesis-quarantine-"));
    process.env.PRIVATE_DIR = mkdtempSync(path.join(tmpdir(), "noesis-private-"));
    process.env.ARCHIVE_MAX_BYTES = String(limits.maxBytes);
    process.env.ARCHIVE_MAX_UNCOMPRESSED = String(limits.maxUncompressed);
    process.env.ARCHIVE_MAX_ENTRIES = String(limits.maxEntries);
    process.env.ARCHIVE_MAX_RATIO = String(limits.maxRatio);
    const started = await startAuthApp();
    baseUrl = started.baseUrl;
    process.env.PUBLIC_MEDIA_BASE = baseUrl;
    close = started.close;
  });

  after(async () => {
    await close();
    await prisma.$disconnect();
  });

  it("rejects invalid terms and non-owners before a version is sellable", async () => {
    const seller = await sellerOf(baseUrl, `price-owner-${stamp}@example.com`);
    const other = await sellerOf(baseUrl, `price-other-${stamp}@example.com`);
    const buyer = await account(baseUrl, `price-buyer-${stamp}@example.com`);
    const productId = await product(baseUrl, seller.headers, `Draft ${stamp}`);
    const body = offerBody("00000000-0000-4000-8000-000000000099", "1500");
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/offers`, body)).status, 401);
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/offers`, body, buyer.headers)).status, 403);
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/offers`, body, other.headers)).status, 404);
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/offers`, { ...body, amountMinor: "10.00" }, seller.headers)).status, 400);
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/offers`, { ...body, currency: "US" }, seller.headers)).status, 400);
    assert.equal((await api(baseUrl, "GET", `/v1/listings/missing-${stamp}`)).status, 404);
    assert.equal(compiledApiLacksProviders(), true);
  });

  it("keeps the old amount and shows only the active offer on a public listing", async () => {
    const seller = await sellerOf(baseUrl, `price-live-${stamp}@example.com`);
    const moderator = await account(baseUrl, `price-mod-${stamp}@example.com`);
    await grant(moderator.userId);
    const ready = await sellableVersion(baseUrl, seller, moderator.headers, `Priced ${stamp}`);
    const first = await api(baseUrl, "POST", `/v1/seller/products/${ready.productId}/offers`, offerBody(ready.versionId, "1500"), seller.headers);
    assert.equal(first.status, 201);
    assert.equal(text(first.body, "licenseCode"), "mit");
    assert.equal(text(first.body, "updatePolicy"), "exact_version");
    assert.equal((await api(baseUrl, "GET", `/v1/listings/${ready.slug}`)).status, 404);
    const second = await api(baseUrl, "POST", `/v1/seller/products/${ready.productId}/offers`, offerBody(ready.versionId, "2500"), seller.headers);
    assert.equal(second.status, 201);
    assert.notEqual(text(second.body, "offerId"), text(first.body, "offerId"));
    const stored = await prisma.offer.findUnique({ where: { id: text(first.body, "offerId") } });
    const history = await api(baseUrl, "GET", `/v1/seller/products/${ready.productId}/offers`, undefined, seller.headers);
    assert.equal(stored?.amountMinor, 1500n);
    assert.equal(stored?.state, "archived");
    assert.equal(history.status, 200);
    assert.equal(JSON.stringify(history.body).includes("1500"), true);
    await publish(baseUrl, seller);
    const card = await api(baseUrl, "GET", `/v1/listings/${ready.slug}`);
    assert.equal(card.status, 200);
    assert.equal(JSON.stringify(card.body).includes("2500"), true);
    assert.equal(JSON.stringify(card.body).includes("private/"), false);
    assert.equal(JSON.stringify(card.body).includes("commission"), false);
    const archived = await api(baseUrl, "POST", `/v1/seller/offers/${text(second.body, "offerId")}/archive`, {}, seller.headers);
    assert.equal(archived.status, 200);
    const hidden = await api(baseUrl, "GET", `/v1/listings/${ready.slug}`);
    assert.equal(isRecord(hidden.body) && hidden.body.price, null);
  });
});

function offerBody(versionId: string, amountMinor: string): Record<string, unknown> {
  return {
    versionId, amountMinor, currency: "usd", licenseCode: "mit", licenseTextId: TEXT,
    updatePolicy: "exact_version", demoUrl: "https://example.com/demo", commissionBps: 1500,
  };
}

async function sellableVersion(baseUrl: string, seller: Account, moderator: Record<string, string>, title: string) {
  const created = await api(baseUrl, "POST", "/v1/seller/products", {
    title, summary: "Draft summary", kind: "code_asset", categoryId: UI, stacks: ["javascript"], tags: ["ui"],
  }, seller.headers);
  const productId = text(created.body, "id");
  const slug = text(created.body, "slug");
  const bytes = storedZip([{ name: "src/app.txt", data: Buffer.from(title) }]);
  const version = await api(baseUrl, "POST", `/v1/seller/products/${productId}/versions`, { versionLabel: "1.0.0" }, seller.headers);
  const versionId = text(version.body, "id");
  const intent = await api(baseUrl, "POST", `/v1/seller/versions/${versionId}/upload-intents`, { contentType: "application/zip", byteSize: bytes.length }, seller.headers);
  const url = isRecord(intent.body) && isRecord(intent.body.upload) && typeof intent.body.upload.url === "string" ? intent.body.upload.url : "";
  assert.equal((await fetch(url, { method: "PUT", headers: { "content-type": "application/zip" }, body: new Uint8Array(bytes) })).status, 204);
  assert.equal((await api(baseUrl, "POST", `/v1/seller/versions/${versionId}/complete-upload`, { byteSize: bytes.length, sha256: "ignored" }, seller.headers)).status, 202);
  await prepareVersion(versionId);
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  const verdict = await scanObject({ versionId, objectKey: row?.quarantineKey ?? "", byteSize: Number(row?.byteSize ?? 0), sha256: row?.sha256 ?? "" }, process.env.QUARANTINE_DIR ?? "", limits);
  if (verdict.verdict !== "pass") {
    throw new Error("expected a passing structural scan");
  }
  await applyVerdict({ versionId, verdict: "pass", reasonCode: verdict.reasonCode, sha256: verdict.sha256 });
  assert.equal((await api(baseUrl, "POST", `/v1/admin/versions/${versionId}/decisions`, { action: "approve", note: "" }, moderator)).status, 201);
  assert.equal(await promoteVersion(versionId), "promoted");
  return { productId, versionId, slug, userId: seller.userId };
}

async function publish(baseUrl: string, seller: Account): Promise<void> {
  await prisma.user.update({ where: { id: seller.userId }, data: { emailVerifiedAt: new Date() } });
  await prisma.sellerProfile.update({ where: { userId: seller.userId }, data: { verificationState: "verification_approved" } });
  const products = await prisma.product.findMany({ where: { sellerId: seller.userId } });
  assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${products[0]?.id ?? ""}/publish`, {}, seller.headers)).status, 201);
}

async function sellerOf(baseUrl: string, email: string): Promise<Account> {
  const seller = await account(baseUrl, email);
  assert.equal((await api(baseUrl, "PUT", "/v1/seller/profile", { displayName: "Slice Six" }, seller.headers)).status, 200);
  return seller;
}

function signup(email: string, password: string): Record<string, string> {
  return {
    email,
    password,
    confirmPassword: password,
    givenName: "Nora",
    familyName: "Petrosyan",
    dial: "374",
    phone: `${Math.floor(10_000_000 + Math.random() * 90_000_000)}`,
  };
}

async function account(baseUrl: string, email: string): Promise<Account> {
  const created = await api(baseUrl, "POST", "/v1/auth/register", signup(email, "correct-horse-1"));
  const session = await api(baseUrl, "POST", "/v1/auth/login", { email, password: "correct-horse-1" });
  return { userId: text(created.body, "userId"), headers: { "x-session-id": text(session.body, "sessionToken") } };
}

async function product(baseUrl: string, headers: Record<string, string>, title: string): Promise<string> {
  const created = await api(baseUrl, "POST", "/v1/seller/products", {
    title, summary: "Draft summary", kind: "code_asset", categoryId: UI, stacks: ["javascript"], tags: ["ui"],
  }, headers);
  assert.equal(created.status, 201);
  return text(created.body, "id");
}

async function grant(userId: string): Promise<void> {
  await prisma.roleAssignment.create({ data: { userId, role: "admin" } });
  await prisma.adminPermission.create({ data: { userId, permission: "moderation" } });
}

function compiledApiLacksProviders(): boolean {
  return walk(path.join(__dirname, "..")).filter((file) => file.endsWith(".js") && !file.endsWith(".test.js")).every((file) => {
    const source = readFileSync(file, "utf8").toLowerCase();
    return !source.includes("stripe") && !source.includes("paypal") && !source.includes("adyen");
  });
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function text(body: unknown, key: string): string {
  return isRecord(body) && typeof body[key] === "string" ? body[key] : "";
}

function scanDist(name: string): string {
  return path.join(__dirname, "../../../../apps/scan/dist", name);
}

function workerDist(name: string): string {
  return path.join(__dirname, "../../../../apps/worker/dist", name);
}

type Account = { userId: string; headers: Record<string, string> };
