export type PricingPort = {
  readonly module: "pricing";
};

export const pricingPort: PricingPort = { module: "pricing" };

export type PublicOffer = {
  offerId: string;
  amountMinor: string;
  currency: string;
  licenseCode: string | null;
  updatePolicy: string | null;
  demoUrl: string | null;
};

export type OfferSnapshot = PublicOffer & {
  productId: string;
  versionId: string;
  licenseTextId: string | null;
  state: "active" | "archived";
  createdAt: string;
};

export type PricingAccess = {
  activeQuotes(productIds: readonly string[]): Promise<ReadonlyMap<string, PublicOffer>>;
  snapshot(offerId: string): Promise<OfferSnapshot | null>;
};

export const PRICING_ACCESS = Symbol("PRICING_ACCESS");
