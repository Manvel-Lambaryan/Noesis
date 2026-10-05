import Link from "next/link";
import { SignOutButton } from "../components/sign-out-button";
import { currentSession, ownSellerProfile, type AccountView } from "../../lib/current-session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Profile</h1>
        <p>Sign in to open your profile.</p>
        <p><Link href="/login">Sign in</Link></p>
      </main>
    );
  }
  const seller = session.roles.includes("seller") ? await ownSellerProfile() : null;
  return (
    <main className="card stack">
      <h1>Profile</h1>
      <Identity session={session} />
      {session.roles.includes("buyer") ? <BuyerPanel session={session} /> : null}
      {session.roles.includes("seller") ? <SellerPanel session={session} name={seller?.displayName ?? ""} state={seller?.verificationState ?? "no profile yet"} /> : null}
      {session.roles.includes("admin") || session.permissions.includes("moderation") ? <AdminPanel /> : null}
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

function SellerPanel({ session, name, state }: { session: AccountView; name: string; state: string }) {
  return (
    <section>
      <h2>Seller</h2>
      <p>{name.length > 0 ? name : "No display name yet"}</p>
      <p>Identity: {state}</p>
      <p>Publication: {session.publish}</p>
      <p><Link href="/account/seller">Seller profile</Link></p>
      <p><Link href="/account/products">Product drafts</Link></p>
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
