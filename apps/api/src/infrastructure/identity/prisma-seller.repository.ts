import type { PrismaService } from "../prisma.service";
import type { SellerRecord, SellerRepository } from "../../modules/seller/seller.repository";

export class PrismaSellerRepository implements SellerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<SellerRecord | null> {
    const row = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    return row === null ? null : toRecord(row);
  }

  async upsertDraft(userId: string, displayName: string): Promise<SellerRecord> {
    const row = await this.prisma.sellerProfile.upsert({
      where: { userId },
      create: { id: crypto.randomUUID(), userId, displayName, verificationState: "draft" },
      update: { displayName },
    });
    return toRecord(row);
  }
}

function toRecord(row: {
  id: string;
  userId: string;
  displayName: string;
  verificationState: SellerRecord["verificationState"];
}): SellerRecord {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    verificationState: row.verificationState,
  };
}
