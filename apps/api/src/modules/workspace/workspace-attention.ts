import type { ActiveOffer, AttentionItem, OwnedProduct, VersionSignal } from "./workspace-model";

const ATTENTION_LIMIT = 8;

export function buildAttention(input: {
  emailVerified: boolean;
  verificationState: string | null;
  products: OwnedProduct[];
  versions: VersionSignal[];
  offers: Map<string, ActiveOffer>;
}): AttentionItem[] {
  const blocked = blockedItems(input.products, input.versions);
  const pricing = pricingItems(input.products, input.versions, input.offers);
  const waiting = waitingItems(input.versions);
  return [...accountItems(input.emailVerified, input.verificationState), ...blocked, ...pricing, ...waiting].slice(0, ATTENTION_LIMIT);
}

function accountItems(emailVerified: boolean, verificationState: string | null): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (!emailVerified) {
    items.push(item("email", "blocked", "Email verification required", "Verify your email before publication is allowed.", "/verify-email"));
  }
  const seller = sellerAttention(verificationState);
  return seller === null ? items : [...items, seller];
}

function sellerAttention(state: string | null): AttentionItem | null {
  if (state === "verification_approved") return null;
  if (state === "verification_rejected") {
    return item("seller-rejected", "blocked", "Seller verification was rejected", "Publication stays closed until verification is approved.", "/account/verification");
  }
  if (state === "suspended") {
    return item("seller-suspended", "blocked", "Seller account needs action", "This seller profile is suspended. Publication stays closed.", "/account/verification");
  }
  if (state === "verification_submitted") {
    return item("seller-pending", "info", "Seller verification is pending", "Publication waits for an approved seller profile.", "/account/verification");
  }
  return item("seller-incomplete", "warning", "Seller verification is incomplete", "Save your profile, then complete seller verification before publishing.", "/account/verification");
}

function blockedItems(products: OwnedProduct[], versions: VersionSignal[]): AttentionItem[] {
  const titles = new Map(products.map((product) => [product.id, product.title]));
  const scans = versions.filter((version) => version.state === "scan_rejected").map((version) => scanItem(version, titles));
  const rejected = versions.filter((version) => version.state === "rejected").map((version) => rejectedItem(version, titles));
  const listings = products.flatMap((product) => listingItem(product));
  return [...scans, ...rejected, ...listings];
}

function scanItem(version: VersionSignal, titles: Map<string, string>): AttentionItem {
  const name = titles.get(version.productId) ?? "Product";
  const reason = version.reasonCode === null || version.reasonCode.length === 0 ? "no reason code stored" : version.reasonCode;
  return item(`scan:${version.id}`, "blocked", `${name} failed the structural scan`, `Version ${version.versionLabel} was rejected by the scan (${reason}).`, productHref(version.productId));
}

function rejectedItem(version: VersionSignal, titles: Map<string, string>): AttentionItem {
  const name = titles.get(version.productId) ?? "Product";
  return item(`rejected:${version.id}`, "blocked", `${name} was rejected by moderation`, `Version ${version.versionLabel} needs a new upload or an appeal. The written note is on the product review.`, productHref(version.productId));
}

function listingItem(product: OwnedProduct): AttentionItem[] {
  if (product.listingState === "taken_down") {
    return [item(`down:${product.id}`, "blocked", `${product.title} was taken down`, "The public listing is hidden. Open the product to appeal.", productHref(product.id))];
  }
  if (product.listingState === "appeal_pending") {
    return [item(`appeal:${product.id}`, "info", `${product.title} has an open appeal`, "The appeal is waiting for a moderation decision.", productHref(product.id))];
  }
  return [];
}

function pricingItems(products: OwnedProduct[], versions: VersionSignal[], offers: Map<string, ActiveOffer>): AttentionItem[] {
  const approved = new Set(versions.filter((version) => version.state === "approved").map((version) => version.productId));
  return products.flatMap((product) => offerItem(product, offers.has(product.id), approved.has(product.id)));
}

function offerItem(product: OwnedProduct, hasOffer: boolean, approved: boolean): AttentionItem[] {
  if (hasOffer) return [];
  if (product.listingState === "published") {
    return [item(`price:${product.id}`, "warning", `${product.title} is public without an active price`, "Create a new offer. Price changes archive the previous offer.", productHref(product.id))];
  }
  if (approved) {
    return [item(`offer:${product.id}`, "warning", `${product.title} has an approved version and no offer`, "An approved private copy can be priced with a new offer.", productHref(product.id))];
  }
  return [];
}

function waitingItems(versions: VersionSignal[]): AttentionItem[] {
  const uploads = versions.filter((version) => version.state === "draft" || version.state === "upload_pending").length;
  const review = new Set(versions.filter((version) => version.state === "pending_moderation").map((version) => version.productId)).size;
  return [...uploadItem(uploads), ...reviewItem(review)];
}

function uploadItem(count: number): AttentionItem[] {
  if (count === 0) return [];
  const title = count === 1 ? "1 version is waiting for an archive" : `${count} versions are waiting for an archive`;
  return [item("awaiting-upload", "warning", title, "Upload the archive before a scan and moderation can start.", "/account/products")];
}

function reviewItem(count: number): AttentionItem[] {
  if (count === 0) return [];
  const title = count === 1 ? "1 product is in moderation" : `${count} products are in moderation`;
  return [item("in-review", "info", title, "These versions passed the structural scan and are waiting for a decision.", "/account/products?queue=review")];
}

function productHref(productId: string): string {
  return `/account/products/${productId}`;
}

function item(id: string, severity: AttentionItem["severity"], title: string, detail: string, href: string): AttentionItem {
  return { id, severity, title, detail, href };
}
