import Link from "next/link";
import { BadgeDollarSign, ChevronRight, CircleAlert, Clock, ShieldAlert, type LucideIcon } from "lucide-react";
import type { AttentionItem } from "../../../lib/workspace-view";
import styles from "./dashboard.module.css";

export function ActionCenter({ items, hasProducts }: { items: AttentionItem[]; hasProducts: boolean }) {
  return (
    <section className={styles.board} aria-labelledby="attention-heading">
      <div className={styles.splitHead}>
        <h2 id="attention-heading">
          Needs Attention
          {items.length > 0 ? <span className={styles.countPill}>{items.length}</span> : null}
        </h2>
        <Link href="/account/products?queue=attention">View all →</Link>
      </div>
      {items.length === 0 ? <Clear hasProducts={hasProducts} /> : <ActionList items={items} />}
    </section>
  );
}

function Clear({ hasProducts }: { hasProducts: boolean }) {
  if (!hasProducts) {
    return (
      <div className={styles.stack}>
        <h3>No products yet</h3>
        <p>Create your first product and start building your seller catalog.</p>
        <Link className={styles.primary} href="/account/products/new">Add New Product</Link>
      </div>
    );
  }
  return <p className={styles.plain}>Nothing in the catalog needs action right now.</p>;
}

function ActionList({ items }: { items: AttentionItem[] }) {
  return (
    <ul className={styles.actions}>
      {items.map((item) => {
        const Icon = mark(item.id);
        return (
          <li key={item.id}>
            <Link className={`${styles.action} ${tone(item.severity)}`} href={item.href}>
              <span className={styles.mark}><Icon strokeWidth={1.75} aria-hidden="true" /></span>
              <span>
                <strong>{item.title}</strong>
                <em>{item.detail}</em>
              </span>
              <ChevronRight strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function mark(id: string): LucideIcon {
  if (id.startsWith("email") || id.startsWith("seller")) return ShieldAlert;
  if (id.startsWith("price") || id.startsWith("offer")) return BadgeDollarSign;
  if (id === "in-review" || id === "awaiting-upload") return Clock;
  return CircleAlert;
}

function tone(severity: AttentionItem["severity"]): string {
  if (severity === "blocked") return styles.blocked;
  if (severity === "info") return styles.info;
  return styles.warnTone;
}
