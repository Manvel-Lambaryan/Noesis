import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const { storedZip, declaredBomb } = load(scanDist("zip-fixture.js")) as {
  storedZip: (files: { name: string; data: Buffer; mode?: number }[]) => Buffer;
  declaredBomb: (uncompressed: number) => Buffer;
};
const { prepareVersion } = load(workerDist("prepare-version.js")) as { prepareVersion: (id: string) => Promise<void> };
const { applyVerdict } = load(workerDist("apply-verdict.js")) as {
  applyVerdict: (job: { versionId: string; verdict: "pass" | "fail"; reasonCode: string; sha256: string }) => Promise<"applied" | "duplicate">;
};
const { scanObject } = load(scanDist("scan-job.js")) as {
  scanObject: (
    job: { versionId: string; objectKey: string; byteSize: number; sha256: string },
    dir: string,
    archiveLimits: typeof limits,
  ) => Promise<{ versionId: string; verdict: "pass" | "fail"; reasonCode: string; sha256: string }>;
};

describe("artifact upload", { concurrency: 1 }, () => {
  let baseUrl = "";
  let stamp = "";
  let close = async (): Promise<void> => {};

  before(async () => {
    stamp = Date.now().toString(36);
    process.env.QUARANTINE_DIR = mkdtempSync(path.join(tmpdir(), "noesis-quarantine-"));
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

  it("rejects anonymous, buyer, and cross-seller access", async () => {
    const owner = await seller(baseUrl, `art-owner-${stamp}@example.com`);
    const other = await seller(baseUrl, `art-other-${stamp}@example.com`);
    const buyer = await account(baseUrl, `art-buyer-${stamp}@example.com`);
    const productId = await product(baseUrl, owner.headers, "Artifact Kit");
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/versions`, { versionLabel: "1.0.0" })).status, 401);
    assert.equal((await api(baseUrl, "POST", `/v1/seller/products/${productId}/versions`, { versionLabel: "1.0.0" }, buyer.headers)).status, 403);
    const versionId = await upload(baseUrl, owner.headers, productId, "1.0.0", storedZip([{ name: "src/app.txt", data: Buffer.from("hello") }]));
    assert.equal((await api(baseUrl, "GET", `/v1/seller/versions/${versionId}`, undefined, other.headers)).status, 404);
  });

  it("stores a trusted checksum and reaches pending moderation once", async () => {
    const owner = await seller(baseUrl, `art-pass-${stamp}@example.com`);
    const productId = await product(baseUrl, owner.headers, "Safe Kit");
    const bytes = storedZip([{ name: "src/app.txt", data: Buffer.from("hello") }]);
    const versionId = await upload(baseUrl, owner.headers, productId, "1.0.0", bytes, "deadbeef");
    const verdict = await inspect(versionId);
    assert.equal(verdict.verdict, "pass");
    assert.equal(verdict.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.notEqual(verdict.sha256, "deadbeef");
    assert.equal(await applyVerdict(verdict), "applied");
    assert.equal(await applyVerdict(verdict), "duplicate");
    const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
    const reports = await prisma.scanReport.count({ where: { versionId } });
    assert.equal(row?.state, "pending_moderation");
    assert.equal(row?.privateKey, null);
    assert.equal(row?.sha256, verdict.sha256);
    assert.equal(reports, 1);
    const listed = await api(baseUrl, "GET", `/v1/seller/versions/${versionId}`, undefined, owner.headers);
    assert.equal(JSON.stringify(listed.body).includes("quarantine/"), false);
    assert.equal((await ids(baseUrl)).includes(productId), false);
    const blocked = await fetch(`${baseUrl}/media/quarantine/${row?.sellerId ?? "none"}`);
    assert.equal(blocked.status, 404);
  });

  it("rejects traversal, bombs, and invalid archives", async () => {
    const owner = await seller(baseUrl, `art-fail-${stamp}@example.com`);
    const productId = await product(baseUrl, owner.headers, "Unsafe Kit");
    const traversal = await rejected(baseUrl, owner.headers, productId, "1.0.0", storedZip([{ name: "../secret.txt", data: Buffer.from("x") }]));
    const bomb = await rejected(baseUrl, owner.headers, productId, "1.0.1", declaredBomb(50_000));
    const invalid = await rejected(baseUrl, owner.headers, productId, "1.0.2", Buffer.from("not-a-zip"));
    assert.equal(traversal, "traversal");
    assert.equal(bomb, "compression_bomb");
    assert.equal(invalid, "format");
    assert.equal(apiSourcesLackScanner(), true);
  });
});

async function upload(baseUrl: string, headers: Record<string, string>, productId: string, label: string, bytes: Buffer, sha256 = "ignored"): Promise<string> {
  const created = await api(baseUrl, "POST", `/v1/seller/products/${productId}/versions`, { versionLabel: label }, headers);
  assert.equal(created.status, 201);
  assert.equal(text(created.body, "state"), "draft");
  const versionId = text(created.body, "id");
  const intent = await api(baseUrl, "POST", `/v1/seller/versions/${versionId}/upload-intents`, {
    contentType: "application/zip",
    byteSize: bytes.length,
  }, headers);
  assert.equal(intent.status, 201);
  const url = uploadUrl(intent.body);
  assert.equal(url.includes("/uploads/quarantine/"), true);
  assert.equal(url.includes(versionId), false);
  const put = await fetch(url, { method: "PUT", headers: { "content-type": "application/zip" }, body: new Uint8Array(bytes) });
  assert.equal(put.status, 204);
  const again = await fetch(url, { method: "GET" });
  assert.notEqual(again.status, 200);
  const done = await api(baseUrl, "POST", `/v1/seller/versions/${versionId}/complete-upload`, { byteSize: bytes.length, sha256 }, headers);
  assert.equal(done.status, 202);
  return versionId;
}

async function inspect(versionId: string) {
  await prepareVersion(versionId);
  await prepareVersion(versionId);
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  assert.equal(row?.state, "scanning");
  assert.equal(row?.quarantineKey?.startsWith("quarantine/"), true);
  return scanObject({
    versionId,
    objectKey: row?.quarantineKey ?? "",
    byteSize: Number(row?.byteSize ?? 0),
    sha256: row?.sha256 ?? "",
  }, process.env.QUARANTINE_DIR ?? "", limits);
}

async function rejected(baseUrl: string, headers: Record<string, string>, productId: string, label: string, bytes: Buffer): Promise<string> {
  const versionId = await upload(baseUrl, headers, productId, label, bytes);
  const verdict = await inspect(versionId);
  assert.equal(verdict.verdict, "fail");
  await applyVerdict(verdict);
  const row = await prisma.productVersion.findUnique({ where: { id: versionId } });
  assert.equal(row?.state, "scan_rejected");
  assert.equal(row?.privateKey, null);
  return row?.reasonCode ?? "";
}

function apiSourcesLackScanner(): boolean {
  return walk(path.join(__dirname, "..")).filter((file) => file.endsWith(".js") && !file.endsWith(".test.js")).every((file) => {
    const source = readFileSync(file, "utf8");
    return !source.includes("inspect-archive") && !source.includes("scan-job");
  });
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function uploadUrl(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.upload) || typeof body.upload.url !== "string") {
    return "";
  }
  return body.upload.url;
}

function scanDist(name: string): string {
  return path.join(__dirname, "../../../../apps/scan/dist", name);
}

function workerDist(name: string): string {
  return path.join(__dirname, "../../../../apps/worker/dist", name);
}

async function product(baseUrl: string, headers: Record<string, string>, title: string): Promise<string> {
  const created = await api(baseUrl, "POST", "/v1/seller/products", {
    title, summary: "Draft summary", kind: "code_asset", categoryId: UI, stacks: ["javascript"], tags: ["ui"],
  }, headers);
  assert.equal(created.status, 201);
  return text(created.body, "id");
}

async function seller(baseUrl: string, email: string) {
  const session = await account(baseUrl, email);
  assert.equal((await api(baseUrl, "PUT", "/v1/seller/profile", { displayName: "Slice Four" }, session.headers)).status, 200);
  return session;
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

async function account(baseUrl: string, email: string) {
  assert.equal((await api(baseUrl, "POST", "/v1/auth/register", signup(email, "correct-horse-1"))).status, 201);
  const session = await api(baseUrl, "POST", "/v1/auth/login", { email, password: "correct-horse-1" });
  assert.equal(session.status, 200);
  return { headers: { "x-session-id": text(session.body, "sessionToken") } };
}

async function ids(baseUrl: string): Promise<string[]> {
  const result = await api(baseUrl, "GET", "/v1/discovery/listings");
  return isRecord(result.body) && Array.isArray(result.body.items)
    ? result.body.items.flatMap((item) => (isRecord(item) && typeof item.productId === "string" ? [item.productId] : []))
    : [];
}

function text(body: unknown, key: string): string {
  return isRecord(body) && typeof body[key] === "string" ? body[key] : "";
}
