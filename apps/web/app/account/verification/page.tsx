import Link from "next/link";
import { loadWorkspace } from "../../../lib/load-workspace";
import { checkLabel } from "../../../lib/workspace-view";
import { StatusBadge, WorkspaceError } from "../workspace/states";
import styles from "../workspace/dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const loaded = await loadWorkspace();
  if (!loaded.ok) return <WorkspaceError reason={loaded.reason} />;
  const checks = loaded.view.checks;
  return (
    <div className={styles.page}>
      <header>
        <h1>Verification</h1>
        <p className={styles.lede}>Publishing still uses the existing seller gate. This page does not replace it, and it cannot submit new documents.</p>
      </header>
      <section className={styles.panel}>
        <h2>Email</h2>
        <StatusBadge value={checks.email} label={checkLabel(checks.email)} />
        <p className={styles.note}>{checks.email === "approved" ? "Email is verified." : <Link href="/verify-email">Verify email</Link>}</p>
      </section>
      <section className={styles.panel}>
        <h2>Seller verification</h2>
        <StatusBadge value={checks.seller} label={checkLabel(checks.seller)} />
        <p className={styles.note}>Current record: {loaded.view.seller.verificationState || "no profile yet"}. A product can be published only when this is verification approved, the email is verified, and the seller role is present.</p>
        <p className={styles.note}><Link href="/account/profile">Edit display name</Link></p>
      </section>
      <section className={styles.quiet}>
        <h2>Payout verification</h2>
        <StatusBadge value="unavailable" label={checkLabel("unavailable")} />
        <p>No payout account is stored. This screen does not collect bank details.</p>
      </section>
    </div>
  );
}
