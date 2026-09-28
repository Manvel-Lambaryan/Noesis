import Link from "next/link";
import { SignOutButton } from "../components/sign-out-button";
import { currentSession } from "../../lib/current-session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await currentSession();
  if (session === null) {
    return (
      <main className="card stack">
        <h1>Account</h1>
        <p>Sign in to see your account.</p>
        <p><Link href="/login">Sign in</Link></p>
      </main>
    );
  }
  return (
    <main className="card stack">
      <h1>Account</h1>
      <p>{session.email}</p>
      <p>Roles: {session.roles.join(", ") || "none"}</p>
      <p>Email: {session.emailVerified ? "verified" : "not verified"}</p>
      <p>Purchase: {session.purchase}</p>
      <p>Seller publication: {session.publish}</p>
      <p><Link href="/account/seller">Seller profile draft</Link></p>
      {!session.emailVerified ? <p><Link href="/verify-email">Verify email</Link></p> : null}
      <SignOutButton />
    </main>
  );
}
