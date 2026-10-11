import type { SellerVersionAccess, VersionSignal } from "../../modules/artifacts/artifacts.public-port";
import type { PrismaService } from "../prisma.service";

const VERSION_LIMIT = 100;

export class PrismaSellerVersions implements SellerVersionAccess {
  constructor(private readonly prisma: PrismaService) {}

  async listForSeller(sellerId: string): Promise<VersionSignal[]> {
    const rows = await this.prisma.productVersion.findMany({
      where: { sellerId },
      orderBy: { updatedAt: "desc" },
      take: VERSION_LIMIT,
      select: {
        id: true,
        productId: true,
        versionLabel: true,
        state: true,
        reasonCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      versionLabel: row.versionLabel,
      state: row.state,
      reasonCode: row.reasonCode,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
