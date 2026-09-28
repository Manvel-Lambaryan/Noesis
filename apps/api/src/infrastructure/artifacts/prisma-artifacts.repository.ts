import type { PrismaService } from "../prisma.service";
import type { ArtifactsRepository, IntentRecord, VersionRecord, VersionState } from "../../modules/artifacts/artifacts.repository";

export class PrismaArtifactsRepository implements ArtifactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createVersion(id: string, productId: string, sellerId: string, versionLabel: string): Promise<VersionRecord> {
    const row = await this.prisma.productVersion.create({ data: { id, productId, sellerId, versionLabel } });
    return mapVersion(row);
  }

  async listForProduct(productId: string, sellerId: string): Promise<VersionRecord[]> {
    const rows = await this.prisma.productVersion.findMany({
      where: { productId, sellerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows.map(mapVersion);
  }

  async findVersion(id: string): Promise<VersionRecord | null> {
    const row = await this.prisma.productVersion.findUnique({ where: { id } });
    return row === null ? null : mapVersion(row);
  }

  async markUploadPending(id: string): Promise<boolean> {
    const result = await this.prisma.productVersion.updateMany({
      where: { id, state: { in: ["draft", "upload_pending"] } },
      data: { state: "upload_pending" },
    });
    return result.count === 1;
  }

  async replaceIntent(intent: IntentRecord & { tokenHash: string }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.uploadIntent.deleteMany({ where: { versionId: intent.versionId, consumedAt: null } }),
      this.prisma.uploadIntent.create({
        data: {
          id: intent.id,
          versionId: intent.versionId,
          tokenHash: intent.tokenHash,
          contentType: intent.contentType,
          byteSize: intent.byteSize,
          objectKey: intent.objectKey,
          expiresAt: intent.expiresAt,
        },
      }),
    ]);
  }

  async findIntent(tokenHash: string): Promise<IntentRecord | null> {
    const row = await this.prisma.uploadIntent.findUnique({ where: { tokenHash } });
    if (row === null) {
      return null;
    }
    return {
      id: row.id,
      versionId: row.versionId,
      contentType: row.contentType,
      byteSize: row.byteSize,
      objectKey: row.objectKey,
      expiresAt: row.expiresAt,
      consumedAt: row.consumedAt,
    };
  }

  async attachUpload(versionId: string, objectKey: string, byteSize: bigint): Promise<boolean> {
    const result = await this.prisma.productVersion.updateMany({
      where: { id: versionId, state: "upload_pending", sha256: null },
      data: { quarantineKey: objectKey, byteSize },
    });
    return result.count === 1;
  }

  async consumeIntent(tokenHash: string, now: Date): Promise<boolean> {
    const result = await this.prisma.uploadIntent.updateMany({
      where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    return result.count === 1;
  }
}

function mapVersion(row: {
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
}): VersionRecord {
  return row;
}
