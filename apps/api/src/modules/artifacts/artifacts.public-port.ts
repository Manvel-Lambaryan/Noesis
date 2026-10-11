export type ArtifactsPort = {
  readonly module: "artifacts";
};

export const artifactsPort: ArtifactsPort = { module: "artifacts" };

export type ApprovedLabel = { versionLabel: string; state: "approved" };

export type Sellability = {
  sellableProductIds(productIds: readonly string[]): Promise<ReadonlySet<string>>;
  approvedLabels(productId: string): Promise<ApprovedLabel[]>;
  isSellableVersion(productId: string, versionId: string): Promise<boolean>;
};

export const SELLABILITY = Symbol("SELLABILITY");

export type VersionSignal = {
  id: string;
  productId: string;
  versionLabel: string;
  state: string;
  reasonCode: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface SellerVersionAccess {
  listForSeller(sellerId: string): Promise<VersionSignal[]>;
}

export const SELLER_VERSIONS = Symbol("SELLER_VERSIONS");

export class NoSellableVersions implements Sellability {
  sellableProductIds(): Promise<ReadonlySet<string>> {
    return Promise.resolve(new Set());
  }

  approvedLabels(): Promise<ApprovedLabel[]> {
    return Promise.resolve([]);
  }

  isSellableVersion(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
