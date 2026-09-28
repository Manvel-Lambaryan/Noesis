import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { PrismaService } from "../prisma.service";

export type StoreResult = "ok" | "missing" | "conflict" | "self";

type Tx = Prisma.TransactionClient;

export class ModerationStore {
  constructor(private readonly prisma: PrismaService) {}

  decideVersion(actorId: string, versionId: string, action: "approve" | "reject", note: string): Promise<StoreResult> {
    return this.prisma.$transaction((tx) => this.versionDecision(tx, actorId, versionId, action, note));
  }

  async queue(): Promise<QueueRow[]> {
    const versions = await this.prisma.productVersion.findMany({
      where: { state: "pending_moderation" },
      orderBy: { updatedAt: "asc" },
      take: 50,
    });
    return Promise.all(versions.map((version) => this.queueRow(version)));
  }

  async versionDetail(versionId: string) {
    const version = await this.prisma.productVersion.findUnique({ where: { id: versionId } });
    if (version === null) {
      return null;
    }
    const product = await this.prisma.product.findUnique({ where: { id: version.productId } });
    const scan = await this.prisma.scanReport.findUnique({ where: { versionId } });
    const decisions = await this.history("version", versionId);
    return { version, product, scan, decisions };
  }

  history(subjectType: string, subjectId: string) {
    return this.prisma.moderationDecision.findMany({
      where: { subjectType, subjectId },
      orderBy: { createdAt: "asc" },
    });
  }

  async sellerReview(sellerId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId } });
    if (product === null) {
      return null;
    }
    const versions = await this.prisma.productVersion.findMany({ where: { productId, sellerId }, orderBy: { createdAt: "desc" } });
    const appeal = await this.prisma.appeal.findFirst({ where: { productId, state: "open" } });
    const decisions = await this.prisma.moderationDecision.findMany({
      where: { subjectType: "version", subjectId: { in: versions.map((version) => version.id) } },
      orderBy: { createdAt: "asc" },
    });
    return { product, versions, appeal, decisions };
  }

  listingAction(actorId: string, productId: string, action: ListingAction, note: string, sellerId?: string): Promise<StoreResult> {
    return this.prisma.$transaction((tx) => this.applyListing(tx, actorId, productId, action, note, sellerId));
  }

  private async versionDecision(tx: Tx, actorId: string, versionId: string, action: "approve" | "reject", note: string): Promise<StoreResult> {
    const version = await tx.productVersion.findUnique({ where: { id: versionId } });
    if (version === null) {
      return "missing";
    }
    if (version.sellerId === actorId) {
      return "self";
    }
    if (version.state !== "pending_moderation") {
      return "conflict";
    }
    const next = action === "approve" ? "approved" : "rejected";
    const updated = await tx.productVersion.updateMany({
      where: { id: versionId, state: "pending_moderation" },
      data: { state: next, reasonCode: action === "approve" ? null : "moderator_rejected" },
    });
    if (updated.count !== 1) {
      return "conflict";
    }
    const event = action === "approve" ? "artifacts.version_approved" : "artifacts.version_rejected";
    await record(tx, actorId, action, "version", versionId, note, event, { versionId, productId: version.productId, reasonCode: note });
    return "ok";
  }

  private async queueRow(version: { id: string; productId: string; sellerId: string; versionLabel: string; sha256: string | null }) {
    const product = await this.prisma.product.findUnique({ where: { id: version.productId } });
    const scan = await this.prisma.scanReport.findUnique({ where: { versionId: version.id } });
    return {
      versionId: version.id,
      productId: version.productId,
      sellerId: version.sellerId,
      title: product?.title ?? "",
      versionLabel: version.versionLabel,
      structuralScan: scanLabel(scan?.verdict),
      sha256: version.sha256,
    };
  }

  private async applyListing(tx: Tx, actorId: string, productId: string, action: ListingAction, note: string, sellerId?: string): Promise<StoreResult> {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (product === null || (sellerId !== undefined && product.sellerId !== sellerId)) {
      return "missing";
    }
    const next = nextListing(product.listingState, action);
    if (next === null) {
      return "conflict";
    }
    if (action === "appeal") {
      await tx.appeal.create({ data: { id: randomUUID(), productId, sellerId: product.sellerId, note, state: "open" } });
    }
    if (action === "restore" || action === "reject_appeal") {
      await tx.appeal.updateMany({ where: { productId, state: "open" }, data: { state: action === "restore" ? "accepted" : "rejected", decidedAt: new Date() } });
    }
    const updated = await tx.product.updateMany({ where: { id: productId, listingState: product.listingState }, data: { listingState: next } });
    if (updated.count !== 1) {
      return "conflict";
    }
    const event = listingEvent(action);
    await record(tx, actorId, action, "listing", productId, note, event, { productId });
    if (action === "takedown") {
      await withdrawApproved(tx, productId);
    }
    return "ok";
  }
}

export type QueueRow = {
  versionId: string;
  productId: string;
  sellerId: string;
  title: string;
  versionLabel: string;
  structuralScan: string;
  sha256: string | null;
};

type ListingAction = "takedown" | "restore" | "reject_appeal" | "appeal";

function nextListing(state: string, action: ListingAction): "taken_down" | "published" | "appeal_pending" | null {
  if (action === "takedown" && (state === "published" || state === "unpublished")) {
    return "taken_down";
  }
  if (action === "appeal" && state === "taken_down") {
    return "appeal_pending";
  }
  if (action === "restore" && state === "appeal_pending") {
    return "published";
  }
  if (action === "reject_appeal" && state === "appeal_pending") {
    return "taken_down";
  }
  return null;
}

function listingEvent(action: ListingAction): string {
  if (action === "takedown") {
    return "catalog.listing_taken_down";
  }
  if (action === "restore") {
    return "catalog.listing_restored";
  }
  return "moderation.decision_recorded";
}

function scanLabel(verdict: string | undefined): string {
  if (verdict === "pass") {
    return "structural_scan_passed";
  }
  return verdict === "fail" ? "structural_scan_failed" : "structural_scan_pending";
}

async function record(tx: Tx, actorId: string, action: string, subjectType: string, subjectId: string, note: string, event: string, data: object): Promise<void> {
  const decisionId = randomUUID();
  await tx.moderationDecision.create({ data: { id: decisionId, actorId, action, subjectType, subjectId, note } });
  await tx.auditEvent.create({ data: { id: randomUUID(), actorId, action, subjectType, subjectId } });
  const payload = JSON.stringify({ ...data, decisionId });
  if (event.startsWith("artifacts.")) {
    await tx.artifactOutbox.create({ data: { id: randomUUID(), type: event, subjectId, payload } });
    return;
  }
  await tx.catalogOutbox.create({ data: { id: randomUUID(), type: event, subjectId, payload } });
}

async function withdrawApproved(tx: Tx, productId: string): Promise<void> {
  const versions = await tx.productVersion.findMany({ where: { productId, state: "approved", NOT: { privateKey: null } }, select: { id: true } });
  for (const version of versions) {
    await tx.artifactOutbox.create({
      data: {
        id: randomUUID(),
        type: "artifacts.version_withdrawn",
        subjectId: version.id,
        payload: JSON.stringify({ versionId: version.id, productId }),
      },
    });
  }
}
