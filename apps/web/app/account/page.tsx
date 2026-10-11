import Link from "next/link";
import { SignOutButton } from "../components/sign-out-button";
import { currentSession, type AccountView } from "../../lib/current-session";
import { SellerDashboard } from "./workspace/dashboard";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Account</h1>
        <p>Sign in to open your account.</p>
        <p><Link href="/login">Sign in</Link></p>
      </main>
    );
  }
  if (session.roles.includes("seller")) return <SellerDashboard />;
  return (
    <main className="card stack">
      <h1>Account</h1>
      <Identity session={session} />
      <BuyerPanel session={session} />
      {session.roles.includes("admin") || session.permissions.includes("moderation") ? <AdminPanel /> : null}
      <p><Link href="/account/seller">Open a seller profile</Link></p>
      <SignOutButton />
    </main>
  );
}

function Identity({ session }: { session: AccountView }) {
  return (
    <section>
      <h2>Account</h2>
      <p>{session.email}</p>
      <p>Email: {session.emailVerified ? "verified" : "not verified"}</p>
      {!session.emailVerified ? <p><Link href="/verify-email">Verify email</Link></p> : null}
    </section>
  );
}

function BuyerPanel({ session }: { session: AccountView }) {
  return (
    <section>
      <h2>Buyer</h2>
      <p>Purchase: {session.purchase}</p>
      <p><Link href="/marketplace">Browse the marketplace</Link></p>
    </section>
  );
}

function AdminPanel() {
  return (
    <section>
      <h2>Admin</h2>
      <p><Link href="/admin/moderation">Moderation queue</Link></p>
    </section>
  );
}
