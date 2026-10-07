import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { ActivityItem, ProductRow } from "../../../lib/workspace-view";
import { kindLabel, listingLabel, minorMoney, relativeTime } from "../../../lib/workspace-view";
import { StatusBadge } from "./states";
import styles from "./dashboard.module.css";

export function ProductBoard({ rows, capped }: { rows: ProductRow[]; capped: boolean }) {
  return (
    <section className={styles.board} aria-labelledby="products-heading">
      <div className={styles.splitHead}>
        <h2 id="products-heading">Your Products</h2>
        <Link href="/account/products">View all products →</Link>
      </div>
      <CatalogTable rows={rows} bare />
      {capped ? <p className={styles.note}>Showing the 50 most recently updated products.</p> : null}
    </section>
  );
}

export function CatalogTable({ rows, bare }: { rows: ProductRow[]; bare?: boolean }) {
  if (rows.length === 0) return bare ? <p className={styles.plain}>No products yet.</p> : <EmptyCatalog />;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Status</th>
            <th>Price</th>
            <th>Views</th>
            <th>Sales</th>
            <th>Updated</th>
            <th><span className={styles.sr}>Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => <ProductLine key={row.id} row={row} />)}
        </tbody>
      </table>
    </div>
  );
}

function EmptyCatalog() {
  return (
    <div className={styles.empty}>
      <h2>No products in this view</h2>
      <p>Create your first product and start building your seller catalog.</p>
      <Link className={styles.primary} href="/account/products/new">Add New Product</Link>
    </div>
  );
}

function ProductLine({ row }: { row: ProductRow }) {
  const status = productStatus(row);
  const offer = row.offer === null ? "No price" : minorMoney(row.offer.amountMinor, row.offer.currency);
  return (
    <tr>
      <td className={styles.productCell} data-label="Product">
        <Thumb row={row} />
        <Link href={`/account/products/${row.id}`}>
          <strong>{row.title}</strong>
          <Stacks stacks={row.stacks} />
          <p className={styles.meta}>{kindLabel(row.kind)}</p>
        </Link>
      </td>
      <td data-label="Status"><StatusBadge value={status.value} label={status.label} /></td>
      <td data-label="Price">{offer}</td>
      <td data-label="Views"><span title="Not collected">—</span></td>
      <td data-label="Sales"><span title="Not collected">—</span></td>
      <td data-label="Updated"><time dateTime={row.updatedAt}>{relativeTime(row.updatedAt, new Date().toISOString())}</time></td>
      <td data-label="Actions"><RowMenu row={row} /></td>
    </tr>
  );
}

function Thumb({ row }: { row: ProductRow }) {
  if (row.previewUrl !== null && row.previewUrl.length > 0) {
    return <img className={styles.thumb} src={row.previewUrl} alt="" width={40} height={40} />;
  }
  return <span className={styles.thumb} aria-hidden="true">{row.title.slice(0, 1).toUpperCase()}</span>;
}

function Stacks({ stacks }: { stacks: string[] }) {
  if (stacks.length === 0) return null;
  return (
    <p className={styles.tags}>
      {stacks.slice(0, 3).map((stack) => <span key={stack}>{stackLabel(stack)}</span>)}
      {stacks.length > 3 ? <span>+{stacks.length - 3}</span> : null}
    </p>
  );
}

function RowMenu({ row }: { row: ProductRow }) {
  return (
    <details className={styles.menu}>
      <summary aria-label={`Actions for ${row.title}`}><MoreHorizontal strokeWidth={1.75} aria-hidden="true" /></summary>
      <div>
        <Link href={`/account/products/${row.id}`}>Manage</Link>
        {row.listingState === "published" ? <Link href={`/marketplace/products/${row.slug}`}>View listing</Link> : null}
      </div>
    </details>
  );
}

export function ActivityList({ items, note, now, compact }: { items: ActivityItem[]; note?: string; now: string; compact?: boolean }) {
  return (
    <section className={compact ? styles.board : styles.panel} aria-labelledby="activity-heading">
      <div className={styles.splitHead}>
        <h2 id="activity-heading">{compact ? "Recent Activity" : "Recent activity"}</h2>
        {compact ? <Link href="/account/activity">View all →</Link> : null}
      </div>
      <p className={styles.note}>Built from current product and version records. This is not a complete audit log.</p>
      {note === undefined ? null : <p className={styles.note}>{note}</p>}
      {items.length === 0 ? <p className={styles.plain}>Activity appears here after you create a product or version.</p> : <ActivityItems items={items} now={now} />}
    </section>
  );
}

function ActivityItems({ items, now }: { items: ActivityItem[]; now: string }) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => (
        <li className={styles.event} key={item.id}>
          <span className={`${styles.dot} ${dotTone(item.status)}`} aria-hidden="true" />
          <div>
            <Link href={item.href}>{item.event}</Link>
            <p>{item.entity}</p>
          </div>
          <time dateTime={item.at}>{relativeTime(item.at, now)}</time>
        </li>
      ))}
    </ol>
  );
}

function productStatus(row: ProductRow): { value: string; label: string } {
  if (row.listingState === "taken_down") return { value: "taken_down", label: "Taken down" };
  if (row.versionState === "rejected" || row.versionState === "scan_rejected") return { value: "rejected", label: "Rejected" };
  if (row.versionState === "pending_moderation") return { value: "pending_moderation", label: "Under review" };
  if (row.listingState === "published") return { value: "published", label: "Published" };
  if (row.listingState === "appeal_pending") return { value: "appeal_pending", label: "Appeal pending" };
  if (row.listingState === "draft") return { value: "draft", label: "Draft" };
  return { value: row.listingState, label: listingLabel(row.listingState) };
}

function stackLabel(value: string): string {
  const known: Record<string, string> = {
    nextjs: "Next.js", react: "React", tailwind: "Tailwind", nodejs: "Node.js", typescript: "TypeScript",
    postgresql: "PostgreSQL", postgres: "PostgreSQL", stripe: "Stripe", figma: "Figma", "react-native": "React Native",
  };
  return known[value.toLowerCase()] ?? value;
}

function dotTone(status: string): string {
  if (status === "approved" || status === "published") return styles.okDot;
  if (status === "rejected" || status === "scan_rejected" || status === "taken_down") return styles.badDot;
  return styles.warnDot;
}
