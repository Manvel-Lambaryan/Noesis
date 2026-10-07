import { buildActivity } from "./workspace-activity";
import { buildAttention } from "./workspace-attention";
import {
  UNAVAILABLE_METRICS,
  type ActiveOffer,
  type CheckStatus,
  type OwnedProduct,
  type ProductRow,
  type VersionSignal,
  type WorkspaceInput,
  type WorkspaceView,
} from "./workspace-model";

const PRODUCT_CAP = 50;
const VERSION_CAP = 100;

export function buildWorkspace(input: WorkspaceInput): WorkspaceView {
  const products = [...input.products].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const offers = new Map(input.offers.map((offer) => [offer.productId, offer]));
  const latest = latestByProduct(input.versions);
  return {
    seller: {
      displayName: input.profile?.displayName ?? "",
      verificationState: input.profile?.verificationState ?? "draft",
      memberSince: input.profile?.createdAt ?? null,
    },
    checks: {
      email: input.emailVerified ? "approved" : "requires_action",
      seller: sellerCheck(input.profile?.verificationState ?? null),
      payout: "unavailable",
    },
    metrics: metrics(products, input.versions),
    unavailable: [...UNAVAILABLE_METRICS],
    attention: buildAttention({
      emailVerified: input.emailVerified,
      verificationState: input.profile?.verificationState ?? null,
      products,
      versions: input.versions,
      offers,
    }),
    products: products.map((product) => row(product, latest.get(product.id) ?? null, offers.get(product.id) ?? null)),
    productsCapped: products.length >= PRODUCT_CAP,
    versionsCapped: input.versions.length >= VERSION_CAP,
    activity: buildActivity(products, input.versions),
  };
}

export function sellerCheck(state: string | null): CheckStatus {
  if (state === "verification_submitted") return "pending";
  if (state === "verification_approved") return "approved";
  if (state === "verification_rejected") return "rejected";
  if (state === "suspended") return "requires_action";
  return "not_started";
}

function metrics(products: OwnedProduct[], versions: VersionSignal[]): WorkspaceView["metrics"] {
  const review = new Set(versions.filter((version) => version.state === "pending_moderation").map((version) => version.productId));
  const action = new Set<string>();
  for (const product of products) {
    if (product.listingState === "taken_down" || product.listingState === "appeal_pending") action.add(product.id);
  }
  for (const version of versions) {
    if (version.state === "rejected" || version.state === "scan_rejected") action.add(version.productId);
  }
  return {
    totalProducts: products.length,
    publishedProducts: products.filter((product) => product.listingState === "published").length,
    underReview: review.size,
    drafts: products.filter((product) => product.listingState === "draft").length,
    needsAction: action.size,
  };
}

function latestByProduct(versions: VersionSignal[]): Map<string, VersionSignal> {
  const map = new Map<string, VersionSignal>();
  for (const version of versions) {
    const current = map.get(version.productId);
    if (current === undefined || version.updatedAt > current.updatedAt) map.set(version.productId, version);
  }
  return map;
}

function row(product: OwnedProduct, version: VersionSignal | null, offer: ActiveOffer | null): ProductRow {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    kind: product.kind,
    listingState: product.listingState,
    hasPreview: product.hasPreview,
    previewUrl: product.previewUrl,
    stacks: product.stacks,
    versionLabel: version?.versionLabel ?? null,
    versionState: version?.state ?? null,
    offer: offer === null ? null : { amountMinor: offer.amountMinor, currency: offer.currency },
    updatedAt: product.updatedAt,
  };
}
