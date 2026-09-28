import type { ApprovedLabel, Sellability } from "../../modules/artifacts/artifacts.public-port";
import type { PrismaService } from "../prisma.service";

export class PrismaSellability implements Sellability {
  constructor(private readonly prisma: PrismaService) {}

  async sellableProductIds(productIds: readonly string[]): Promise<ReadonlySet<string>> {
    if (productIds.length === 0) {
      return new Set();
    }
    const rows = await this.prisma.productVersion.findMany({
      where: { productId: { in: [...productIds] }, state: "approved", NOT: { privateKey: null } },
      select: { productId: true },
    });
    return new Set(rows.map((row) => row.productId));
  }

  async approvedLabels(productId: string): Promise<ApprovedLabel[]> {
    const rows = await this.prisma.productVersion.findMany({
      where: { productId, state: "approved", NOT: { privateKey: null } },
      select: { versionLabel: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ versionLabel: row.versionLabel, state: "approved" as const }));
  }
}