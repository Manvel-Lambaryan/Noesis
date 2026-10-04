import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
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
const { storedZip } = load(scanDist("zip-fixture.js")) as {
  storedZip: (files: { name: string; data: Buffer }[]) => Buffer;
};
const { prepareVersion } = load(workerDist("prepare-version.js")) as { prepareVersion: (id: string) => Promise<void> };
const { applyVerdict } = load(workerDist("apply-verdict.js")) as {
  applyVerdict: (job: { versionId: string; verdict: "pass" | "fail"; reasonCode: string; sha256: string }) => Promise<unknown>;
};
const { scanObject } = load(scanDist("scan-job.js")) as {
  scanObject: (job: { versionId: string; objectKey: string; byteSize: number; sha256: string }, dir: string, archiveLimits: typeof limits) => Promise<{ versionId: string; verdict: "pass" | "fail"; reasonCode: string; sha256: string }>;
};
const { promoteVersion } = load(workerDist("promote-version.js")) as {
  promoteVersion: (id: string) => Promise<"promoted" | "duplicate" | "failed" | "missing">;
};
const { quarantinePath, quarantineRoot } = load(workerDist("quarantine-path.js")) as {
  quarantinePath: (root: string, key: string) => string;
  quarantineRoot: () => string;
};

describe("moderation and publication", { concurrency: 1 }, () => {
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

  it("covers authorization, self-approval, rejection, and audit", async () => {
    const seller = await readySeller(baseUrl, `mod-seller-${stamp}@example.com`);
    const moderator = await moderatorOf(baseUrl, `mod-reviewer-${stamp}@example.com`);
    const buyer = await account(baseUrl, `mod-buyer-${stamp}@example.com`);
    const finance = await moderatorOf(baseUrl, `mod-finance-${stamp}@example.com`, "finance");
    const pending = await scannedVersion(baseUrl, seller, `Reject ${stamp}`);
    await expectClosed(baseUrl, pending.versionId, buyer.headers, finance.headers, seller);
    assert.equal((await api(baseUrl, "GET", `/v1/listings/${pending.slug}`)).status, 404);
    const queue = await api(baseUrl, "GET", "/v1/admin/moderation/queue", undefined, moderator.headers);
    const detail = await api(baseUrl, "GET", `/v1/admin/versions/${pending.versionId}`, undefined, moderator.headers);
    assert.equal(queue.status, 200);
    assert.equal(JSON.stringify(queue.body).includes(pending.versionId), true);
    assert.equal(JSON.stringify(detail.body).includes("structural_scan_passed"), true);
    const short = await api(baseUrl, "POST", `/v1/admin/versions/${pending.versionId}/decisions`, { action: "reject", note: "short" }, moderator.headers);
    assert.equal(short.status, 400);
    const rejected = await api(baseUrl, "POST", `/v1/admin/versions/${pending.versionId}/decisions`, {
      action: "reject", note: "The archive includes a disallowed payload.",
    }, moderator.headers);
    assert.equal(rejected.status, 201);
    assert.equal(JSON.stringify(rejected.body).includes("malware"), false);
    await expectRejected(pending, seller.headers, baseUrl);
  });

  it("covers promotion, publication, discovery, takedown, and appeals", async () => {
    const seller = await readySeller(baseUrl, `pub-seller-${stamp}@example.com`);
    const stranger = await readySeller(baseUrl, `pub-other-${stamp}@example.com`);
    const moderator = await moderatorOf(baseUrl, `pub-reviewer-${stamp}@example.com`);
    const pending = await scannedVersion(baseUrl, seller, `Publish ${stamp}`);
    await hideArchive(pending.versionId);
    const approved = await api(baseUrl, "POST", `/v1/admin/versions/${pending.versionId}/decisions`, {
      action: "approve", note: "",
    }, moderator.headers);
    assert.equal(approved.status, 201);
    assert.equal(await promoteVersion(pending.versionId), "failed");
    await expectUnsellable(baseUrl, seller, pending);
    await restoreArchive(pending.versionId, pending.bytes);
    assert.equal(await promoteVersion(pending.versionId), "promoted");
    assert.equal(await promoteVersion(pending.versionId), "duplicate");
    await expectPublished(baseUrl, seller, moderator, stranger.headers, pending);
    await expectLedgerUntouched();
  });
});

async function expectClosed(baseUrl: string, versionId: string, buyer: Record<string, string>, finance: Record<string, string>, seller: Account): Promise<void> {
  const pathName = `/v1/admin/versions/${versionId}/decisions`;
  const body = { action: "reject", note: "This explanation is long enough." };
  assert.equal((await api(baseUrl, "POST", pathName, body)).status, 401);
  assert.equal((await api(baseUrl, "POST", pathName, body, buyer)).status, 403);
  assert.equal((await api(baseUrl, "POST", pathName, body, finance)).status, 403);
  assert.equal((await api(baseUrl, "GET", "/v1/admin/moderation/queue", undefined, buyer)).status, 403);
  await grant(seller.userId, "moderation");
  const self = await api(baseUrl, "POST", pathName, { action: "approve", note: "" }, seller.headers);
  assert.equal(self.status, 403);
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  assert.equal(row?.state, "pending_moderation");
  const detail = await api(baseUrl, "GET", `/v1/admin/versions/${versionId}`, undefined, finance);
  assert.equal(detail.status, 403);
}

async function expectRejected(pending: Pending, headers: Record<string, string>, baseUrl: string): Promise<void> {
  const versionId = pending.versionId;
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  const decision = await prisma.moderationDecision.findFirst({ where: { subjectId: versionId, action: "reject" } });
  const audit = await prisma.auditEvent.count({ where: { subjectId: versionId, action: "reject" } });
  assert.equal(row?.state, "rejected");
  assert.equal(row?.privateKey, null);
  assert.equal(decision?.note, "The archive includes a disallowed payload.");
  assert.equal(audit, 1);
  const review = await api(baseUrl, "GET", `/v1/seller/products/${pending.productId}/review`, undefined, headers);
  assert.equal(review.status, 200);
  assert.equal(JSON.stringify(review.body).includes("disallowed payload"), true);
  const published = await api(baseUrl, "POST", `/v1/seller/products/${pending.productId}/publish`, {}, headers);
  assert.equal(published.status, 409);
  assert.equal(code(published.body), "not_sellable");
  assert.equal((await api(baseUrl, "GET", `/v1/listings/${pending.slug}`)).status, 404);
}

async function expectUnsellable(baseUrl: string, seller: Account, pending: Pending): Promise<void> {
  const row = await prisma.productVersion.findUnique({ where: { id: pending.versionId } });
  assert.equal(row?.state, "approved");
  assert.equal(row?.privateKey, null);
  const early = await api(baseUrl, "POST", `/v1/seller/products/${pending.productId}/publish`, {}, seller.headers);
  assert.equal(early.status, 409);
  assert.equal(code(early.body), "not_sellable");
  await prisma.user.update({ where: { id: seller.userId }, data: { emailVerifiedAt: null } });
  const unverified = await api(baseUrl, "POST", `/v1/seller/products/${pending.productId}/publish`, {}, seller.headers);
  assert.equal(unverified.status, 403);
  await prisma.user.update({ where: { id: seller.userId }, data: { emailVerifiedAt: new Date() } });
  await prisma.sellerProfile.update({ where: { userId: seller.userId }, data: { verificationState: "draft" } });
  const unverifiedSeller = await api(baseUrl, "POST", `/v1/seller/products/${pending.productId}/publish`, {}, seller.headers);
  assert.equal(unverifiedSeller.status, 403);
  await prisma.sellerProfile.update({ where: { userId: seller.userId }, data: { verificationState: "verification_approved" } });
}

async function expectPublished(baseUrl: string, seller: Account, moderator: Account, stranger: Record<string, string>, pending: Pending): Promise<void> {
  const promoted = await prisma.artifactOutbox.count({ where: { subjectId: pending.versionId, type: "artifacts.object_promoted" } });
  const approvedEvent = await prisma.artifactOutbox.count({ where: { subjectId: pending.versionId, type: "artifacts.version_approved" } });
  assert.equal(promoted, 1);
  assert.equal(approvedEvent, 1);
  const hidden = await api(baseUrl, "GET", `/v1/listings/${pending.slug}`);
  assert.equal(hidden.status, 404);
  const draft = await api(baseUrl, "POST", `/v1/seller/products/${pending.productId}/versions`, { versionLabel: "0.9.0" }, seller.headers);
  assert.equal(draft.status, 201);
  const published = await api(baseUrl, "POST", `/v1/seller/products/${pending.productId}/publish`, {}, seller.headers);
  assert.equal(published.status, 201);
  await expectPublic(baseUrl, pending);
  const removed = await api(baseUrl, "POST", `/v1/admin/listings/${pending.productId}/takedown`, { note: "Policy takedown for this listing." }, moderator.headers);
  assert.equal(removed.status, 201);
  await expectWithdrawn(baseUrl, pending, seller.headers, stranger);
}

async function expectPublic(baseUrl: string, pending: Pending): Promise<void> {
  const card = await api(baseUrl, "GET", `/v1/listings/${pending.slug}`);
  const versions = await api(baseUrl, "GET", `/v1/listings/${pending.slug}/versions`);
  assert.equal(card.status, 200);
  assert.equal(JSON.stringify(card.body).includes("private/"), false);
  assert.equal(JSON.stringify(versions.body).includes(pending.versionLabel), true);
  assert.equal(JSON.stringify(versions.body).includes("0.9.0"), false);
  const row = await prisma.productVersion.findUnique({ where: { id: pending.versionId } });
  const stored = await readFile(path.join(process.env.PRIVATE_DIR ?? "", row?.privateKey ?? ""));
  assert.equal(stored.length, pending.bytes.length);
  const blocked = await fetch(`${baseUrl}/media/${row?.privateKey ?? "private/missing"}`);
  assert.equal(blocked.status, 404);
}

async function expectWithdrawn(baseUrl: string, pending: Pending, owner: Record<string, string>, stranger: Record<string, string>): Promise<void> {
  const row = await prisma.productVersion.findUnique({ where: { id: pending.versionId } });
  const withdrawn = await prisma.artifactOutbox.count({ where: { subjectId: pending.versionId, type: "artifacts.version_withdrawn" } });
  assert.equal(row?.state, "approved");
  assert.equal(withdrawn, 1);
  assert.equal((await api(baseUrl, "GET", `/v1/listings/${pending.slug}`)).status, 404);
  const appeal = await api(baseUrl, "POST", `/v1/seller/listings/${pending.productId}/appeals`, { note: "Please restore this listing." }, owner);
  assert.equal(appeal.status, 201);
  const duplicate = await api(baseUrl, "POST", `/v1/seller/listings/${pending.productId}/appeals`, { note: "Please restore this listing." }, owner);
  assert.equal(duplicate.status, 409);
  const foreign = await api(baseUrl, "POST", `/v1/seller/listings/${pending.productId}/appeals`, { note: "Please restore this listing." }, stranger);
  assert.equal(foreign.status, 404);
}

async function scannedVersion(baseUrl: string, seller: Account, title: string): Promise<Pending> {
  const created = await api(baseUrl, "POST", "/v1/seller/products", {
    title, summary: "Draft summary", kind: "code_asset", categoryId: UI, stacks: ["javascript"], tags: ["ui"],
  }, seller.headers);
  assert.equal(created.status, 201);
  const productId = text(created.body, "id");
  const slug = text(created.body, "slug");
  const bytes = storedZip([{ name: "src/app.txt", data: Buffer.from(title) }]);
  const version = await api(baseUrl, "POST", `/v1/seller/products/${productId}/versions`, { versionLabel: "1.0.0" }, seller.headers);
  const versionId = text(version.body, "id");
  const intent = await api(baseUrl, "POST", `/v1/seller/versions/${versionId}/upload-intents`, {
    contentType: "application/zip", byteSize: bytes.length,
  }, seller.headers);
  const url = uploadUrl(intent.body);
  assert.equal((await fetch(url, { method: "PUT", headers: { "content-type": "application/zip" }, body: new Uint8Array(bytes) })).status, 204);
  assert.equal((await api(baseUrl, "POST", `/v1/seller/versions/${versionId}/complete-upload`, { byteSize: bytes.length, sha256: "ignored" }, seller.headers)).status, 202);
  await prepareVersion(versionId);
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  const verdict = await scanObject({
    versionId, objectKey: row?.quarantineKey ?? "", byteSize: Number(row?.byteSize ?? 0), sha256: row?.sha256 ?? "",
  }, process.env.QUARANTINE_DIR ?? "", limits);
  assert.equal(verdict.verdict, "pass");
  await applyVerdict(verdict);
  return { productId, versionId, slug, bytes, versionLabel: "1.0.0" };
}

async function hideArchive(versionId: string): Promise<void> {
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  await rm(quarantinePath(quarantineRoot(), row?.quarantineKey ?? ""));
}

async function restoreArchive(versionId: string, bytes: Buffer): Promise<void> {
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  await writeFile(quarantinePath(quarantineRoot(), row?.quarantineKey ?? ""), bytes);
}

async function readySeller(baseUrl: string, email: string): Promise<Account> {
  const seller = await account(baseUrl, email);
  assert.equal((await api(baseUrl, "PUT", "/v1/seller/profile", { displayName: "Slice Five" }, seller.headers)).status, 200);
  await prisma.user.update({ where: { id: seller.userId }, data: { emailVerifiedAt: new Date() } });
  await prisma.sellerProfile.update({ where: { userId: seller.userId }, data: { verificationState: "verification_approved" } });
  return seller;
}

async function moderatorOf(baseUrl: string, email: string, permission: "moderation" | "finance" = "moderation"): Promise<Account> {
  const user = await account(baseUrl, email);
  await grant(user.userId, permission);
  return user;
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
  assert.equal(created.status, 201);
  const session = await api(baseUrl, "POST", "/v1/auth/login", { email, password: "correct-horse-1" });
  return { userId: text(created.body, "userId"), headers: { "x-session-id": text(session.body, "sessionToken") } };
}

async function grant(userId: string, permission: "moderation" | "finance"): Promise<void> {
  await prisma.roleAssignment.create({ data: { userId, role: "admin" } });
  await prisma.adminPermission.create({ data: { userId, permission } });
}

async function expectLedgerUntouched(): Promise<void> {
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'commerce' ORDER BY table_name
  `;
  assert.deepEqual(tables.map((table) => table.table_name), ["schema_anchor"]);
}

function uploadUrl(body: unknown): string {
  return isRecord(body) && isRecord(body.upload) && typeof body.upload.url === "string" ? body.upload.url : "";
}

function text(body: unknown, key: string): string {
  return isRecord(body) && typeof body[key] === "string" ? body[key] : "";
}

function code(body: unknown): string {
  return text(body, "code");
}

function scanDist(name: string): string {
  return path.join(__dirname, "../../../../apps/scan/dist", name);
}

function workerDist(name: string): string {
  return path.join(__dirname, "../../../../apps/worker/dist", name);
}

type Account = { userId: string; headers: Record<string, string> };
type Pending = { productId: string; versionId: string; slug: string; bytes: Buffer; versionLabel: string };
