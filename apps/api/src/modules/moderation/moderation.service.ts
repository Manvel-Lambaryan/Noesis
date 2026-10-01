import { Inject, Injectable } from "@nestjs/common";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import { ArtifactQueue } from "../../infrastructure/queue/artifact-queue";
import { ModerationStore, type StoreResult } from "../../infrastructure/moderation/moderation-store";
import { DISCOVERY_ACCESS, type DiscoveryAccess } from "../discovery/discovery.public-port";
import { IAM_ACCESS, type IamAccess } from "../iam/iam.public-port";
import type { ModerationAccess } from "./moderation.public-port";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ModerationService implements ModerationAccess {
  constructor(
    private readonly store: ModerationStore,
    private readonly jobs: ArtifactQueue,
    @Inject(DISCOVERY_ACCESS) private readonly discovery: DiscoveryAccess,
    @Inject(IAM_ACCESS) private readonly iam: IamAccess,
  ) {}

  async queue(actor: Actor): Promise<{ items: unknown[] }> {
    this.iam.requireModeration(actor);
    return { items: await this.store.queue() };
  }

  async detail(actor: Actor, versionId: string) {
    this.iam.requireModeration(actor);
    const row = await this.store.versionDetail(parseId(versionId));
    if (row === null || row.product === null) {
      throw missing();
    }
    return presentDetail(row);
  }

  async decide(actor: Actor, versionId: string, body: Record<string, unknown>) {
    this.iam.requireModeration(actor);
    const action = body.action === "approve" || body.action === "reject" ? body.action : null;
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (action === null || (action === "reject" && (note.length < 8 || note.length > 500)) || note.length > 500) {
      throw new AuthFailure(400, "validation_failed", "Rejection requires an explanation of at least 8 characters.");
    }
    const id = parseId(versionId);
    const result = await this.store.decideVersion(actor.userId, id, action, note);
    assertResult(result);
    if (action === "approve") {
      await this.jobs.enqueuePromote(id);
    }
    return { state: action === "approve" ? "approved" : "rejected", promoted: false, structuralScan: "structural_scan_passed" };
  }

  async takedown(actor: Actor, productId: string, body: Record<string, unknown>) {
    this.iam.requireModeration(actor);
    await this.listing(actor.userId, productId, "takedown", requiredNote(body));
    return { listingState: "taken_down" };
  }

  async restore(actor: Actor, productId: string, body: Record<string, unknown>) {
    this.iam.requireModeration(actor);
    const reject = body.decision === "reject";
    await this.listing(actor.userId, productId, reject ? "reject_appeal" : "restore", requiredNote(body));
    return { listingState: reject ? "taken_down" : "published" };
  }

  async appeal(actor: Actor, productId: string, body: Record<string, unknown>) {
    if (!actor.roles.includes("seller")) {
      throw new AuthFailure(403, "forbidden", "Seller role required.");
    }
    try {
      await this.listing(actor.userId, productId, "appeal", requiredNote(body), actor.userId);
    } catch (error) {
      if (duplicate(error)) {
        throw new AuthFailure(409, "conflict", "This listing already has an open appeal.");
      }
      throw error;
    }
    return { listingState: "appeal_pending" };
  }

  async sellerReview(actor: Actor, productId: string) {
    if (!actor.roles.includes("seller")) {
      throw new AuthFailure(403, "forbidden", "Seller role required.");
    }
    const row = await this.store.sellerReview(actor.userId, parseId(productId));
    if (row === null) {
      throw missing();
    }
    return presentSeller(row);
  }

  private async listing(actorId: string, productId: string, action: "takedown" | "restore" | "reject_appeal" | "appeal", note: string, sellerId?: string) {
    const result = await this.store.listingAction(actorId, parseId(productId), action, note, sellerId);
    assertResult(result);
    await this.discovery.rebuild();
  }
}

function presentDetail(row: NonNullable<Awaited<ReturnType<ModerationStore["versionDetail"]>>>) {
  const version = row.version;
  return {
    versionId: version.id,
    productId: version.productId,
    title: row.product?.title ?? "",
    summary: row.product?.summary ?? "",
    kind: row.product?.kind ?? "",
    versionLabel: version.versionLabel,
    state: version.state,
    sha256: version.sha256,
    promoted: version.privateKey !== null,
    structuralScan: row.scan?.verdict === "pass" ? "structural_scan_passed" : row.scan?.verdict === "fail" ? "structural_scan_failed" : "structural_scan_pending",
    scanEngine: row.scan?.engine ?? null,
    scanReason: row.scan?.reasonCode ?? null,
    decisions: row.decisions.map(presentDecision),
  };
}

function presentSeller(row: NonNullable<Awaited<ReturnType<ModerationStore["sellerReview"]>>>) {
  return {
    productId: row.product.id,
    listingState: row.product.listingState,
    appeal: row.appeal === null ? null : { state: row.appeal.state, note: row.appeal.note },
    versions: row.versions.map((version) => ({
      id: version.id,
      versionLabel: version.versionLabel,
      state: version.state,
      sha256: version.sha256,
      reasonCode: version.reasonCode,
      promoted: version.privateKey !== null,
      structuralScan: version.state === "pending_moderation" || version.state === "approved" || version.state === "rejected" ? "structural_scan_passed" : version.state === "scan_rejected" ? "structural_scan_failed" : "structural_scan_pending",
    })),
    decisions: row.decisions.map(presentDecision),
  };
}

function presentDecision(row: { id: string; action: string; note: string; createdAt: Date }) {
  return { id: row.id, action: row.action, note: row.note, createdAt: row.createdAt.toISOString() };
}

function requiredNote(body: Record<string, unknown>): string {
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length < 8 || note.length > 500) {
    throw new AuthFailure(400, "validation_failed", "An explanation of at least 8 characters is required.");
  }
  return note;
}

function assertResult(result: StoreResult): void {
  if (result === "ok") {
    return;
  }
  if (result === "self") {
    throw new AuthFailure(403, "forbidden", "You cannot moderate your own product.");
  }
  if (result === "missing") {
    throw missing();
  }
  throw new AuthFailure(409, "conflict", "That moderation action is not available.");
}

function parseId(value: string): string {
  if (!UUID.test(value)) {
    throw missing();
  }
  return value.toLowerCase();
}

function missing(): AuthFailure {
  return new AuthFailure(404, "not_found", "That record was not found.");
}

function duplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
