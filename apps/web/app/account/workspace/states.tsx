import Link from "next/link";
import styles from "./dashboard.module.css";

const TONE: Record<string, string> = {
  published: styles.ok,
  approved: styles.ok,
  pending_moderation: styles.warn,
  appeal_pending: styles.warn,
  upload_pending: styles.warn,
  scanning: styles.warn,
  quarantined: styles.warn,
  pending: styles.warn,
  rejected: styles.bad,
  scan_rejected: styles.bad,
  taken_down: styles.bad,
  requires_action: styles.bad,
  suspended: styles.bad,
};

export function StatusBadge({ value, label }: { value: string; label: string }) {
  return <span className={`${styles.badge} ${TONE[value] ?? styles.neutral}`}>{label}</span>;
}

export function WorkspaceError({ reason }: { reason: "denied" | "unavailable" }) {
  const denied = reason === "denied";
  return (
    <section className={styles.error} role="alert">
      <h2>{denied ? "Seller workspace is unavailable" : "Workspace data could not be loaded"}</h2>
      <p>{denied ? "This area is only for your own seller account." : "The seller summary did not load. Refresh the page. No figures are shown in its place."}</p>
    </section>
  );
}

export function ModulePending({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <section className={styles.page}>
      <p className={styles.note}>{kicker}</p>
      <div className={styles.empty}>
        <h1>{title}</h1>
        <p>{body}</p>
        <Link href="/account">Back to dashboard</Link>
      </div>
    </section>
  );
}
