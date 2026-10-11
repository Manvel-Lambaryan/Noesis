import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  Clock,
  Package,
  ShoppingBag,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import styles from "./studio.module.css";

export function Welcome({ name }: { name: string }) {
  return (
    <header className={styles.welcome}>
      <div>
        <h1>Welcome back, {name}</h1>
        <p>Here’s what’s happening with your products and business.</p>
      </div>
      <div className={styles.actions}>
        <Link className={styles.ghost} href="/marketplace"><Store strokeWidth={1.75} aria-hidden="true" />View Store</Link>
        <Link className={styles.cta} href="/account/products/new">Add New Product <ArrowRight strokeWidth={1.75} aria-hidden="true" /></Link>
      </div>
    </header>
  );
}

export function MetricGrid({ metrics }: { metrics: { totalProducts: number; publishedProducts: number; underReview: number } }) {
  return (
    <section className={styles.metrics} aria-label="Catalog summary">
      <Metric label="Total Products" value={String(metrics.totalProducts)} hint="In your catalog" icon={Package} />
      <Metric label="Published" value={String(metrics.publishedProducts)} hint="Live listings" icon={Check} />
      <Metric label="Under Review" value={String(metrics.underReview)} hint="Awaiting moderation" icon={Clock} />
      <Metric label="Total Sales" value="Not available" hint="Not connected" icon={ShoppingBag} quiet />
      <Metric label="Revenue" value="Not available" hint="Not connected" icon={BadgeDollarSign} quiet />
      <Metric label="Available Balance" value="Not available" hint="Not connected" icon={Wallet} quiet />
    </section>
  );
}

function Metric({ label, value, hint, icon: Icon, quiet }: { label: string; value: string; hint: string; icon: LucideIcon; quiet?: boolean }) {
  return (
    <article className={styles.metric}>
      <span className={styles.icon}><Icon strokeWidth={1.75} aria-hidden="true" /></span>
      <p>{label}</p>
      <strong className={quiet ? styles.quietValue : undefined}>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}

export function SalesOverview() {
  return (
    <section className={styles.sales} aria-labelledby="sales-heading">
      <div className={styles.salesHead}>
        <h2 id="sales-heading">Sales Overview</h2>
        <span className={styles.range}>Last 30 days</span>
      </div>
      <p className={styles.salesLabel}>Revenue</p>
      <p className={styles.salesValue}>Not available</p>
      <p className={styles.salesCopy}>Total revenue from your products is recorded by the ledger, which is not connected.</p>
      <dl className={styles.salesStats}>
        <div><dt>Total Sales</dt><dd>Not available</dd></div>
        <div><dt>Product Views</dt><dd>Not available</dd></div>
        <div><dt>Conversion Rate</dt><dd>Not available</dd></div>
      </dl>
      <ChartWell />
    </section>
  );
}

function ChartWell() {
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 640 168" role="img" aria-label="No revenue series for the last 30 days">
        <title>No revenue series</title>
        {[36, 72, 108, 144].map((y) => <line key={y} x1="8" x2="632" y1={y} y2={y} />)}
      </svg>
      <p>No revenue series yet.</p>
    </div>
  );
}

const QUICK = [
  { href: "/account/products/new", title: "Add New Product", copy: "Create and publish your next big idea.", cta: "Create product", image: "/brand/previews/saas-starter.jpg" },
  { href: "/account/products", title: "Manage Pricing", copy: "Update offers and grow your revenue.", cta: "Manage offers", image: "/brand/previews/saas-dashboard.jpg" },
  { href: "/account/analytics", title: "View Analytics", copy: "Detailed insights about your products.", cta: "Open analytics", image: "/brand/previews/admin-dashboard.jpg" },
  { href: "/account/inbox", title: "Talk to Customers", copy: "Schedule calls and manage conversations.", cta: "Open inbox", image: "/brand/previews/mobile-ui.jpg" },
] as const;

export function QuickActions() {
  return (
    <section className={styles.quick} aria-label="Quick actions">
      {QUICK.map((item) => (
        <Link className={styles.shot} href={item.href} key={item.title}>
          <img src={item.image} alt="" width={640} height={400} />
          <span>
            <strong>{item.title}</strong>
            <em>{item.copy}</em>
            <b>{item.cta} <ArrowRight strokeWidth={1.75} aria-hidden="true" /></b>
          </span>
        </Link>
      ))}
    </section>
  );
}
