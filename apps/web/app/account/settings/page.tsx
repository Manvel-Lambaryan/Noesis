import Link from "next/link";
import styles from "../workspace/dashboard.module.css";

export const dynamic = "force-dynamic";

const GROUPS = [
  { title: "Account", status: "Available", body: "Display name is saved on the seller profile.", href: "/account/profile", action: "Edit profile" },
  { title: "Security", status: "Available", body: "Password reset uses the existing account flow. Session management is not listed here.", href: "/forgot-password", action: "Reset password" },
  { title: "Notifications", status: "Not configured", body: "In-app and push preferences are not stored. Verification and password reset still send email.", href: "/account/notifications", action: "Notification status" },
  { title: "Marketplace preferences", status: "Not configured", body: "Default currency, timezone, and language are not stored." },
  { title: "Payout settings", status: "Not available", body: "Payout accounts wait for the payments ledger. Nothing here moves money." },
  { title: "Developer / API", status: "Not configured", body: "API keys are not issued." },
] as const;

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <header>
        <h1>Settings</h1>
        <p className={styles.lede}>Only settings that exist today can be changed. The rest are marked so they are not mistaken for live controls.</p>
      </header>
      <div className={styles.stack}>
        {GROUPS.map((group) => (
          <section className={group.status === "Available" ? styles.panel : styles.quiet} key={group.title}>
            <h2>{group.title}</h2>
            <p className={styles.note}>{group.status}</p>
            <p>{group.body}</p>
            {"href" in group ? <p><Link href={group.href}>{group.action}</Link></p> : null}
          </section>
        ))}
      </div>
    </div>
  );
}
