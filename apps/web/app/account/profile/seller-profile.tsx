import Link from "next/link";
import { AuthForm } from "../../components/auth-form";
import { currentSession, ownSellerProfile } from "../../../lib/current-session";
import { loadWorkspace } from "../../../lib/load-workspace";
import { checkLabel, formatWhen } from "../../../lib/workspace-view";
import styles from "../workspace/dashboard.module.css";

const UNCOLLECTED = ["Avatar or logo", "Short bio", "Website", "Country", "Languages", "Social links", "Developer technologies"];

export async function SellerProfileEditor() {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Seller profile</h1>
        <p><Link href="/login">Sign in</Link> to save a draft.</p>
      </main>
    );
  }
  const profile = await ownSellerProfile();
  return (
    <div className={styles.page}>
      <AuthForm
        action="/api/seller/profile"
        method="PUT"
        title="Seller profile"
        submitLabel="Save draft"
        successMessage="Draft saved. Publication still waits for email verification and seller verification."
        fields={[{
          name: "displayName",
          label: "Display name",
          type: "text",
          autoComplete: "organization",
          defaultValue: profile?.displayName ?? "",
          minLength: 2,
        }]}
      />
      <ProfileFacts email={session.email} state={profile?.verificationState ?? "no profile yet"} seller={session.roles.includes("seller")} />
    </div>
  );
}

async function ProfileFacts({ email, state, seller }: { email: string; state: string; seller: boolean }) {
  const loaded = seller ? await loadWorkspace() : null;
  const since = loaded?.ok ? loaded.view.seller.memberSince : null;
  return (
    <section className={styles.quiet}>
      <h2>On file</h2>
      <ul>
        <li><span>Email</span><strong>{email}</strong></li>
        <li><span>Verification</span><strong>{state}</strong></li>
        <li><span>Seller since</span><strong>{since === null ? "Not recorded" : formatWhen(since)}</strong></li>
        <li><span>Payout verification</span><strong>{checkLabel("unavailable")}</strong></li>
      </ul>
      <p className={styles.note}>Not collected yet: {UNCOLLECTED.join(", ")}. Sensitive verification details stay off the public listing.</p>
      <p className={styles.note}><Link href="/account/verification">Verification center</Link></p>
    </section>
  );
}
