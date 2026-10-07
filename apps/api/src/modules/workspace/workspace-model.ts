export const UNAVAILABLE_METRICS = ["sales", "revenue", "views", "availableBalance", "pendingPayout"] as const;

export type UnavailableMetric = (typeof UNAVAILABLE_METRICS)[number];

export type CheckStatus = "not_started" | "pending" | "approved" | "rejected" | "requires_action" | "unavailable";

export type OwnedProduct = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  listingState: string;
  hasPreview: boolean;
  previewUrl: string | null;
  stacks: string[];
  createdAt: string;
  updatedAt: string;
};

export type VersionSignal = {
  id: string;
  productId: string;
  versionLabel: string;
  state: string;
  reasonCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActiveOffer = {
  productId: string;
  amountMinor: string;
  currency: string;
};

export type WorkspaceInput = {
  emailVerified: boolean;
  profile: { displayName: string; verificationState: string; createdAt: string } | null;
  products: OwnedProduct[];
  versions: VersionSignal[];
  offers: ActiveOffer[];
};

export type AttentionItem = {
  id: string;
  severity: "blocked" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
};

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  listingState: string;
  hasPreview: boolean;
  previewUrl: string | null;
  stacks: string[];
  versionLabel: string | null;
  versionState: string | null;
  offer: { amountMinor: string; currency: string } | null;
  updatedAt: string;
};

export type ActivityItem = {
  id: string;
  at: string;
  event: string;
  entity: string;
  status: string;
  kind: "catalog" | "version";
  href: string;
};

export type WorkspaceView = {
  seller: { displayName: string; verificationState: string; memberSince: string | null };
  checks: { email: CheckStatus; seller: CheckStatus; payout: "unavailable" };
  metrics: {
    totalProducts: number;
    publishedProducts: number;
    underReview: number;
    drafts: number;
    needsAction: number;
  };
  unavailable: UnavailableMetric[];
  attention: AttentionItem[];
  products: ProductRow[];
  productsCapped: boolean;
  versionsCapped: boolean;
  activity: ActivityItem[];
};
