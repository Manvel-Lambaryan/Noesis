import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Logger } from "@noesis/kernel";
import { AuthFailure } from "../../auth/auth-failure";
import type { Actor } from "../../auth/actor";
import { API_LOGGER } from "../../health/health.controller";
import { ArtifactRateLimit } from "../../infrastructure/artifacts/artifact-rate-limit";
import { ArtifactQueue } from "../../infrastructure/queue/artifact-queue";
import { CATALOG_ACCESS, type CatalogAccess } from "../catalog/catalog.public-port";
import {
  archiveMaxBytes,
  invalid,
  missingProduct,
  missingVersion,
  parseArchiveType,
  parseByteSize,
  parseLabel,
  parseProductId,
  parseVersionId,
  uploadTtlSeconds,
} from "./artifact-policy";
import {
  ARTIFACTS_REPOSITORY,
  presentVersion,
  type ArtifactsRepository,
  type VersionRecord,
} from "./artifacts.repository";

@Injectable()
export class ArtifactsService {
  constructor(
    @Inject(ARTIFACTS_REPOSITORY) private readonly versions: ArtifactsRepository,
    @Inject(CATALOG_ACCESS) private readonly catalog: CatalogAccess,
    private readonly limits: ArtifactRateLimit,
    private readonly queue: ArtifactQueue,
    @Inject(API_LOGGER) private readonly logger: Logger,
  ) {}

  async createVersion(actor: Actor, productId: string, body: Record<string, unknown>) {
    const sellerId = seller(actor);
    const owned = await this.catalog.findOwned(sellerId, parseProductId(productId));
    if (owned === null) {
      throw missingProduct();
    }
    try {
      const version = await this.versions.createVersion(randomUUID(), owned.id, sellerId, parseLabel(body.versionLabel));
      return presentVersion(version);
    } catch (error) {
      if (uniqueConflict(error)) {
        throw new AuthFailure(409, "conflict", "That version label already exists.");
      }
      throw error;
    }
  }

  async listVersions(actor: Actor, productId: string) {
    const sellerId = seller(actor);
    const owned = await this.catalog.findOwned(sellerId, parseProductId(productId));
    if (owned === null) {
      throw missingProduct();
    }
    const rows = await this.versions.listForProduct(owned.id, sellerId);
    return { versions: rows.map(presentVersion) };
  }

  async getVersion(actor: Actor, versionId: string) {
    return presentVersion(await this.owned(actor, versionId));
  }

  async createIntent(actor: Actor, versionId: string, body: Record<string, unknown>, correlationId: string) {
    const version = await this.owned(actor, versionId);
    if (version.state !== "draft" && version.state !== "upload_pending") {
      throw new AuthFailure(409, "conflict", "This version is no longer waiting for an upload.");
    }
    await this.limits.assertIntentAllowed(version.sellerId);
    const contentType = parseArchiveType(body.contentType);
    const byteSize = parseByteSize(body.byteSize, archiveMaxBytes());
    const token = randomBytes(32).toString("base64url");
    const intentId = randomUUID();
    const extension = contentType === "application/zip" ? "zip" : "gz";
    const objectKey = `quarantine/${version.sellerId}/${version.id}/${intentId}.${extension}`;
    const pending = await this.versions.markUploadPending(version.id);
    if (!pending) {
      throw new AuthFailure(409, "conflict", "This version is no longer waiting for an upload.");
    }
    const expiresAt = new Date(Date.now() + uploadTtlSeconds() * 1000);
    await this.versions.replaceIntent({
      id: intentId,
      versionId: version.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      contentType,
      byteSize: BigInt(byteSize),
      objectKey,
      expiresAt,
      consumedAt: null,
    });
    this.logger.info({ message: "artifact upload", status: "accepted", correlationId });
    const base = (process.env.PUBLIC_MEDIA_BASE ?? "http://127.0.0.1:3001").replace(/\/$/, "");
    return { intentId, expiresAt: expiresAt.toISOString(), upload: { method: "PUT", url: `${base}/uploads/quarantine/${token}` } };
  }

  async openUpload(token: string): Promise<{ objectKey: string; byteSize: number }> {
    const intent = await this.usableIntent(token);
    return { objectKey: intent.objectKey, byteSize: Number(intent.byteSize) };
  }

  async finishUpload(token: string, byteSize: number): Promise<void> {
    const intent = await this.usableIntent(token);
    if (byteSize !== Number(intent.byteSize)) {
      throw invalid("Uploaded archive size does not match the upload intent.");
    }
    const consumed = await this.versions.consumeIntent(hashToken(token), new Date());
    if (!consumed) {
      throw new AuthFailure(409, "conflict", "This upload link was already used.");
    }
    const attached = await this.versions.attachUpload(intent.versionId, intent.objectKey, intent.byteSize);
    if (!attached) {
      throw new AuthFailure(409, "conflict", "This version is no longer waiting for an upload.");
    }
  }

  async completeUpload(actor: Actor, versionId: string, body: Record<string, unknown>) {
    const version = await this.owned(actor, versionId);
    if (version.state !== "upload_pending" || version.quarantineKey === null) {
      throw new AuthFailure(409, "conflict", "Upload the archive before completing it.");
    }
    const declared = parseByteSize(body.byteSize, archiveMaxBytes());
    if (version.byteSize !== null && Number(version.byteSize) !== declared) {
      throw invalid("Declared archive size does not match the uploaded object.");
    }
    await this.queue.enqueuePrepare(version.id);
    return { state: "upload_pending" as const };
  }

  private async usableIntent(token: string) {
    const intent = await this.versions.findIntent(hashToken(token));
    if (intent === null || intent.consumedAt !== null || intent.expiresAt.getTime() <= Date.now()) {
      throw new AuthFailure(404, "not_found", "Upload link not found.");
    }
    return intent;
  }

  private async owned(actor: Actor, versionId: string): Promise<VersionRecord> {
    const version = await this.versions.findVersion(parseVersionId(versionId));
    if (version === null || version.sellerId !== seller(actor)) {
      throw missingVersion();
    }
    return version;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function seller(actor: Actor): string {
  if (!actor.roles.includes("seller")) {
    throw new AuthFailure(403, "forbidden", "Seller role required.");
  }
  return actor.userId;
}

function uniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
