import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { api, isRecord, startAuthApp } from "../auth/auth-test-client";

const prisma = new PrismaClient();
const UI = "a1000000-0000-4000-8000-000000000001";
const BUSINESS = "a1000000-0000-4000-8000-000000000008";
const LEDGER = "b2000000-0000-4000-8000-000000000001";
const BUTTONS = "b2000000-0000-4000-8000-000000000002";
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("catalog", { concurrency: 1 }, () => {
  let baseUrl = "";
  let stamp = "";
  let close = async (): Promise<void> => {};

  before(async () => {
    stamp = Date.now().toString(36);
    const started = await startAuthApp();
    baseUrl = started.baseUrl;
    close = started.close;
  });

  after(async () => {
    await prisma.discoveryDocument.deleteMany({ where: { productId: { in: [LEDGER, BUTTONS] } } });
    await close();
    await prisma.$disconnect();
  });

  it("exposes the accepted categories and no javascript product table", async () => {
    const listed = await api(baseUrl, "GET", "/v1/categories");
    const slugs = names(listed.body, "slug");
    assert.equal(listed.status, 200);
    assert.equal(slugs.length, 10);
    assert.equal(slugs.includes("ui-components") && slugs.includes("developer-tools"), true);
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'catalog' AND table_name = 'javascript_products'
    `;
    assert.equal(tables.length, 0);
    const docs = await fetch(`${baseUrl}/docs-json`);
    const spec: unknown = await docs.json();
    assert.equal(isRecord(spec) && isRecord(spec.paths) && "/v1/discovery/listings" in spec.paths, true);
  });

  it("keeps drafts private to the owner", async () => {
    const owner = await seller(baseUrl, `owner-${stamp}@example.com`);
    const other = await seller(baseUrl, `other-${stamp}@example.com`);
    const buyer = await account(baseUrl, `buyer-${stamp}@example.com`);
    const created = await api(baseUrl, "POST", "/v1/seller/products", draft("Private Kit"), owner.headers);
    const id = text(created.body, "id");
    assert.equal(created.status, 201);
    assert.equal((await api(baseUrl, "GET", `/v1/seller/products/${id}`, undefined, other.headers)).status, 404);
    assert.equal((await api(baseUrl, "POST", "/v1/seller/products", draft("Nope"), buyer.headers)).status, 403);
    assert.equal((await api(baseUrl, "GET", `/v1/listings/${text(created.body, "slug")}`)).status, 404);
    assert.equal((await ids(baseUrl, "view=general")).includes(id), false);
    const patched = await api(baseUrl, "PATCH", `/v1/seller/products/${id}`, {
      summary: "A private description",
      kind: "business_application",
      categoryId: BUSINESS,
      stacks: ["typescript"],
      tags: ["billing"],
    }, owner.headers);
    assert.equal(patched.status, 200);
    assert.equal(text(patched.body, "summary"), "A private description");
    assert.deepEqual(isRecord(patched.body) ? patched.body.stacks : [], ["typescript"]);
  });

  it("rejects unsafe previews and stores a png outside quarantine", async () => {
    const owner = await seller(baseUrl, `preview-${stamp}@example.com`);
    const created = await api(baseUrl, "POST", "/v1/seller/products", draft("Preview Kit"), owner.headers);
    const id = text(created.body, "id");
    const rejected = await api(baseUrl, "POST", `/v1/seller/products/${id}/preview-intents`, {
      contentType: "application/zip",
      byteSize: 12,
    }, owner.headers);
    assert.equal(rejected.status, 400);
    const intent = await api(baseUrl, "POST", `/v1/seller/products/${id}/preview-intents`, {
      contentType: "image/png",
      byteSize: PNG.length,
    }, owner.headers);
    const stored = await api(baseUrl, "POST", `/v1/seller/products/${id}/previews`, {
      intentId: text(intent.body, "intentId"),
      dataBase64: PNG.toString("base64"),
    }, owner.headers);
    assert.equal(intent.status, 201);
    assert.equal(stored.status, 201);
    assert.equal(text(stored.body, "url").includes("/media/previews/"), true);
    assert.equal(text(stored.body, "url").includes("quarantine"), false);
    const reused = await api(baseUrl, "POST", `/v1/seller/products/${id}/previews`, {
      intentId: text(intent.body, "intentId"),
      dataBase64: PNG.toString("base64"),
    }, owner.headers);
    assert.equal(reused.status, 400);
  });

  it("returns one typescript business application from both marketplace views", async () => {
    await seedPublicPair();
    const javascript = await ids(baseUrl, "view=javascript");
    const business = await ids(baseUrl, "view=business_apps");
    assert.equal(javascript.includes(LEDGER) && business.includes(LEDGER), true);
    assert.equal(javascript.filter((item) => item === LEDGER).length, 1);
    assert.equal(business.includes(BUTTONS), false);
    assert.equal((await ids(baseUrl, "view=general")).includes(LEDGER), true);
    assert.equal((await ids(baseUrl, "view=general&category=ui-components")).includes(BUTTONS), true);
    assert.equal((await ids(baseUrl, "view=general&category=ui-components")).includes(LEDGER), false);
    assert.equal((await ids(baseUrl, "view=general&kind=business_application")).includes(LEDGER), true);
    assert.equal((await ids(baseUrl, "view=general&stack=typescript")).includes(LEDGER), true);
    assert.equal((await ids(baseUrl, "view=general&stack=typescript")).includes(BUTTONS), false);
    assert.equal((await ids(baseUrl, "view=general&q=billing")).includes(LEDGER), true);
    const detail = await api(baseUrl, "GET", "/v1/listings/ledger-desk");
    assert.equal(text(detail.body, "productId"), LEDGER);
  });

  it("does not index a product until a sellable version exists", async () => {
    const owner = await seller(baseUrl, `rebuild-${stamp}@example.com`);
    const created = await api(baseUrl, "POST", "/v1/seller/products", draft("Hidden Launch"), owner.headers);
    const id = text(created.body, "id");
    await prisma.roleAssignment.create({ data: { userId: owner.userId, role: "admin" } });
    await prisma.adminPermission.create({ data: { userId: owner.userId, permission: "moderation" } });
    const signedIn = await account(baseUrl, `rebuild-${stamp}@example.com`);
    const first = await api(baseUrl, "POST", "/v1/admin/discovery/rebuild", undefined, signedIn.headers);
    await prisma.product.update({ where: { id }, data: { listingState: "published" } });
    const second = await api(baseUrl, "POST", "/v1/admin/discovery/rebuild", undefined, signedIn.headers);
    assert.equal(first.status, 200);
    assert.equal(isRecord(second.body) ? second.body.indexed : 1, 0);
    assert.equal(await prisma.discoveryDocument.findUnique({ where: { productId: id } }), null);
    await prisma.product.update({ where: { id }, data: { listingState: "draft" } });
  });

  it("rate limits product creation", async () => {
    process.env.CATALOG_CREATE_MAX = "2";
    try {
      const owner = await seller(baseUrl, `limit-${stamp}@example.com`);
      const statuses = [];
      for (const title of ["Limit One", "Limit Two", "Limit Three"]) {
        statuses.push((await api(baseUrl, "POST", "/v1/seller/products", draft(title), owner.headers)).status);
      }
      assert.deepEqual(statuses, [201, 201, 429]);
    } finally {
      delete process.env.CATALOG_CREATE_MAX;
    }
  });
});

async function seedPublicPair(): Promise<void> {
  await prisma.discoveryDocument.deleteMany({ where: { productId: { in: [LEDGER, BUTTONS] } } });
  await prisma.discoveryDocument.create({ data: publicDoc(LEDGER, "ledger-desk", "Ledger Desk", "A typescript billing desk", "business_application", BUSINESS, "business-applications", "Business Applications", ["typescript"], ["billing"]) });
  await prisma.discoveryDocument.create({ data: publicDoc(BUTTONS, "button-kit", "Button Kit", "Python buttons", "code_asset", UI, "ui-components", "UI Components", ["python"], ["ui"]) });
}

function publicDoc(productId: string, slug: string, title: string, summary: string, kind: string, categoryId: string, categorySlug: string, categoryName: string, stacks: string[], tags: string[]) {
  return { productId, slug, title, summary, kind, categoryId, categorySlug, categoryName, stacks, tags, previewUrls: [], listingState: "published", updatedAt: new Date() };
}

function draft(title: string) {
  return { title, summary: "Draft summary", kind: "code_asset", categoryId: UI, stacks: ["javascript"], tags: ["ui"] };
}

async function seller(baseUrl: string, email: string) {
  const session = await account(baseUrl, email);
  const profile = await api(baseUrl, "PUT", "/v1/seller/profile", { displayName: "Slice Three" }, session.headers);
  assert.equal(profile.status, 200);
  return session;
}

async function account(baseUrl: string, email: string) {
  const registered = await api(baseUrl, "POST", "/v1/auth/register", { email, password: "correct-horse-1" });
  assert.equal(registered.status === 201 || registered.status === 409, true);
  const session = await login(baseUrl, email);
  const user = await prisma.user.findUnique({ where: { email } });
  return { headers: session.headers, userId: user?.id ?? text(registered.body, "userId") };
}

async function login(baseUrl: string, email: string) {
  const result = await api(baseUrl, "POST", "/v1/auth/login", { email, password: "correct-horse-1" });
  assert.equal(result.status, 200);
  return { headers: { "x-session-id": text(result.body, "sessionToken") }, userId: "" };
}

async function ids(baseUrl: string, query: string): Promise<string[]> {
  const result = await api(baseUrl, "GET", `/v1/discovery/listings?${query}`);
  assert.equal(result.status, 200);
  return isRecord(result.body) && Array.isArray(result.body.items) ? names(result.body.items, "productId") : [];
}

function names(body: unknown, key: string): string[] {
  const rows = Array.isArray(body) ? body : [];
  return rows.flatMap((item) => (isRecord(item) && typeof item[key] === "string" ? [item[key]] : []));
}

function text(body: unknown, key: string): string {
  return isRecord(body) && typeof body[key] === "string" ? body[key] : "";
}
