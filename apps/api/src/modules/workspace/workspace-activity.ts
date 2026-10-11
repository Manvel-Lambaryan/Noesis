import type { ActivityItem, OwnedProduct, VersionSignal } from "./workspace-model";

const ACTIVITY_LIMIT = 12;

const VERSION_EVENT: Record<string, string> = {
  draft: "Version created",
  upload_pending: "Archive upload started",
  quarantined: "Archive received",
  scanning: "Structural scan started",
  scan_rejected: "Structural scan rejected",
  pending_moderation: "Submitted for moderation",
  approved: "Version approved",
  rejected: "Version rejected",
  withdrawn: "Version withdrawn",
};

export function buildActivity(products: OwnedProduct[], versions: VersionSignal[]): ActivityItem[] {
  const titles = new Map(products.map((product) => [product.id, product.title]));
  const items = products.flatMap(catalogEvents).concat(versions.map((version) => versionEvent(version, titles)));
  return items.sort((left, right) => right.at.localeCompare(left.at)).slice(0, ACTIVITY_LIMIT);
}

function catalogEvents(product: OwnedProduct): ActivityItem[] {
  const href = `/account/products/${product.id}`;
  const created = entry(`product:${product.id}:created`, product.createdAt, "Product created", product.title, product.listingState, "catalog", href);
  if (product.updatedAt === product.createdAt) return [created];
  const updated = entry(`product:${product.id}:updated`, product.updatedAt, "Product updated", product.title, product.listingState, "catalog", href);
  return [created, updated];
}

function versionEvent(version: VersionSignal, titles: Map<string, string>): ActivityItem {
  const name = titles.get(version.productId) ?? "Product";
  return entry(
    `version:${version.id}`,
    version.updatedAt,
    VERSION_EVENT[version.state] ?? "Version updated",
    `${name} · ${version.versionLabel}`,
    version.state,
    "version",
    `/account/products/${version.productId}`,
  );
}

function entry(id: string, at: string, event: string, entity: string, status: string, kind: ActivityItem["kind"], href: string): ActivityItem {
  return { id, at, event, entity, status, kind, href };
}
