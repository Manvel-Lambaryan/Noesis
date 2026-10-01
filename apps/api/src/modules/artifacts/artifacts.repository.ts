export type VersionState =
  | "draft"
  | "upload_pending"
  | "quarantined"
  | "scanning"
  | "scan_rejected"
  | "pending_moderation"
  | "approved"
  | "rejected"
  | "withdrawn";

export type VersionRecord = {
  id: string;
  productId: string;
  sellerId: string;
  versionLabel: string;
  state: VersionState;
  byteSize: bigint | null;
  sha256: string | null;
  quarantineKey: string | null;
  privateKey: string | null;
  reasonCode: string | null;
};

export type IntentRecord = {
  id: string;
  versionId: string;
  contentType: string;
  byteSize: bigint;
  objectKey: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type ArtifactsRepository = {
  createVersion(id: string, productId: string, sellerId: string, versionLabel: string): Promise<VersionRecord>;
  listForProduct(productId: string, sellerId: string): Promise<VersionRecord[]>;
  findVersion(id: string): Promise<VersionRecord | null>;
  markUploadPending(id: string): Promise<boolean>;
  replaceIntent(intent: IntentRecord & { tokenHash: string }): Promise<void>;
  findIntent(tokenHash: string): Promise<IntentRecord | null>;
  consumeIntent(tokenHash: string, now: Date): Promise<boolean>;
  attachUpload(versionId: string, objectKey: string, byteSize: bigint): Promise<boolean>;
};

export const ARTIFACTS_REPOSITORY = Symbol("ARTIFACTS_REPOSITORY");

export function presentVersion(version: VersionRecord) {
  return {
    id: version.id,
    productId: version.productId,
    versionLabel: version.versionLabel,
    state: version.state,
    byteSize: version.byteSize === null ? null : Number(version.byteSize),
    sha256: version.sha256,
    reasonCode: version.reasonCode,
  };
}
