"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  BarChart3,
  Bell,
  CircleCheck,
  CircleX,
  Coins,
  FilePen,
  History,
  Inbox,
  KeyRound,
  Landmark,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Phone,
  ScanSearch,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { WORKSPACE_NAV, badgeFor, linkActive, type NavCounts, type WorkspaceGroup } from "../../../lib/workspace-nav";
import styles from "./sidebar.module.css";

const ICONS: Record<string, LucideIcon> = {
  "/account": LayoutDashboard,
  "/account/products": Package,
  "/account/products?listing=draft": FilePen,
  "/account/products?listing=published": CircleCheck,
  "/account/products?queue=review": ScanSearch,
  "/account/products?queue=rejected": CircleX,
  "/account/sales": ShoppingBag,
  "/account/customers": Users,
  "/account/licenses": KeyRound,
  "/account/finance": Landmark,
  "/account/finance/transactions": ArrowLeftRight,
  "/account/finance/earnings": Coins,
  "/account/finance/payouts": Wallet,
  "/account/inbox": MessagesSquare,
  "/account/calls": Phone,
  "/account/inquiries": Inbox,
  "/account/analytics": BarChart3,
  "/account/analytics?view=products": Package,
  "/account/analytics?view=traffic": Activity,
  "/account/activity": History,
  "/account/notifications": Bell,
  "/account/profile": BadgeCheck,
  "/account/settings": Settings,
};

export function WorkspaceSidebar({ name, email, verified, status, counts, onClose }: {
  name: string;
  email: string;
  verified: boolean;
  status: string;
  counts: NavCounts | null;
  onClose?: () => void;
}) {
  const path = usePathname();
  const search = useSearchParams().toString();
  const main = WORKSPACE_NAV.filter((group) => group.label !== "Account");
  const account = WORKSPACE_NAV.find((group) => group.label === "Account");
  return (
    <aside className={styles.sidebar}>
      <SellerChip name={name} email={email} verified={verified} status={status} onClose={onClose} />
      <nav className={styles.nav} aria-label="Seller workspace">
        {main.map((group) => (
          <Group key={group.label} group={group} path={path} search={search} counts={counts} labeled={group.label !== "Overview"} />
        ))}
      </nav>
      {account === undefined ? null : (
        <div className={styles.footer}>
          <Group group={account} path={path} search={search} counts={counts} labeled={false} />
        </div>
      )}
    </aside>
  );
}

function SellerChip({ name, email, verified, status, onClose }: {
  name: string;
  email: string;
  verified: boolean;
  status: string;
  onClose?: () => void;
}) {
  const label = name.trim().length > 0 ? name.trim() : email;
  return (
    <div className={styles.sellerRow}>
      <Link className={styles.seller} href="/account/profile">
        <span className={styles.avatar} aria-hidden="true">{initials(label, email)}</span>
        <span className={styles.identity}>
          <strong className={styles.name}>{label}</strong>
          {status.trim().length > 0 ? <em className={verified ? `${styles.role} ${styles.verified}` : styles.role}>{status}</em> : null}
        </span>
      </Link>
      {onClose === undefined ? null : (
        <button className={styles.close} type="button" aria-label="Close menu" onClick={onClose}>
          <X strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Group({ group, path, search, counts, labeled }: {
  group: WorkspaceGroup;
  path: string;
  search: string;
  counts: NavCounts | null;
  labeled: boolean;
}) {
  return (
    <div className={styles.group}>
      {labeled ? <p className={styles.groupLabel}>{group.label}</p> : null}
      {group.links.map((link) => {
        const Icon = iconFor(link.href);
        const count = badgeFor(link.href, counts);
        const current = linkActive(link.href, path, search);
        return (
          <Link key={link.href} className={styles.link} href={link.href} aria-current={current ? "page" : undefined}>
            <span className={styles.icon} aria-hidden="true"><Icon strokeWidth={1.75} /></span>
            <span className={styles.label}>{link.label}</span>
            {count === null ? null : <span className={styles.count}>{count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function iconFor(href: string): LucideIcon {
  return ICONS[href] ?? LayoutDashboard;
}

function initials(name: string, email: string): string {
  const source = name.trim().length > 0 ? name : email.split("@")[0] ?? "N";
  const parts = source.split(/[\s._-]+/).filter((part) => part.length > 0).slice(0, 2);
  return parts.map((part) => part[0] ?? "").join("").toUpperCase() || "N";
}
