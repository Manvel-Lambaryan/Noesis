import { randomUUID } from "node:crypto";
import type { Offer, Prisma } from "@prisma/client";
import type { PrismaService } from "../prisma.service";

export type StoredOffer = {
  id: string;
  productId: string;
  sellerId: string;
  versionId: string;
  amountMinor: bigint;
  currency: string;
  licenseCode: string | null;
  licenseTextId: string | null;
  updatePolicy: string | null;
  demoUrl: string | null;
  state: "active" | "archived";
  createdAt: Date;
};

export type NewOffer = {
  productId: string;
  sellerId: string;
  versionId: string;
  amountMinor: bigint;
  currency: string;
  licenseCode: string | null;
  licenseTextId: string | null;
  updatePolicy: string | null;
  demoUrl: string | null;
};

type Tx = Prisma.TransactionClient;

export class OfferStore {
  constructor(private readonly prisma: PrismaService) {}

  async listForProduct(productId: string, sellerId: string): Promise<StoredOffer[]> {
    const rows = await this.prisma.offer.findMany({ where: { productId, sellerId }, orderBy: { createdAt: "desc" } });
    return rows.map(stored);
  }

  async findForSeller(offerId: string, sellerId: string): Promise<StoredOffer | null> {
    const row = await this.prisma.offer.findFirst({ where: { id: offerId, sellerId } });
    return row === null ? null : stored(row);
  }

  async findAny(offerId: string): Promise<StoredOffer | null> {
    const row = await this.prisma.offer.findUnique({ where: { id: offerId } });
    return row === null ? null : stored(row);
  }

  async activeForProducts(productIds: readonly string[]): Promise<StoredOffer[]> {
    if (productIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.offer.findMany({ where: { productId: { in: [...productIds] }, state: "active" } });
    return rows.map(stored);
  }

  replaceActive(input: NewOffer): Promise<StoredOffer> {
    return this.prisma.$transaction((tx) => this.insertActive(tx, input));
  }

  archive(offerId: string, sellerId: string): Promise<"ok" | "missing" | "conflict"> {
    return this.prisma.$transaction((tx) => this.archiveOne(tx, offerId, sellerId));
  }

  private async insertActive(tx: Tx, input: NewOffer): Promise<StoredOffer> {
    const current = await tx.offer.findMany({ where: { productId: input.productId, state: "active" } });
    for (const row of current) {
      await this.markArchived(tx, row);
    }
    const created = await tx.offer.create({ data: { id: randomUUID(), state: "active", ...input } });
    await this.outbox(tx, "pricing.offer_activated", created);
    return stored(created);
  }

  private async archiveOne(tx: Tx, offerId: string, sellerId: string): Promise<"ok" | "missing" | "conflict"> {
    const row = await tx.offer.findFirst({ where: { id: offerId, sellerId } });
    if (row === null) {
      return "missing";
    }
    if (row.state !== "active") {
      return "conflict";
    }
    await this.markArchived(tx, row);
    return "ok";
  }

  private async markArchived(tx: Tx, row: Offer): Promise<void> {
    const updated = await tx.offer.updateMany({ where: { id: row.id, state: "active" }, data: { state: "archived" } });
    if (updated.count === 1) {
      await this.outbox(tx, "pricing.offer_archived", row);
    }
  }

  private outbox(tx: Tx, type: string, row: Offer): Promise<unknown> {
    return tx.pricingOutbox.create({
      data: {
        id: randomUUID(),
        type,
        subjectId: row.id,
        payload: JSON.stringify({
          offerId: row.id,
          productId: row.productId,
          amountMinor: row.amountMinor.toString(),
          currency: row.currency,
        }),
      },
    });
  }
}

function stored(row: Offer): StoredOffer {
  return {
    id: row.id,
    productId: row.productId,
    sellerId: row.sellerId,
    versionId: row.versionId,
    amountMinor: row.amountMinor,
    currency: row.currency,
    licenseCode: row.licenseCode,
    licenseTextId: row.licenseTextId,
    updatePolicy: row.updatePolicy,
    demoUrl: row.demoUrl,
    state: row.state,
    createdAt: row.createdAt,
  };
}
