import Link from "next/link";
import { AuthForm } from "../../components/auth-form";
import { currentSession, ownSellerProfile } from "../../../lib/current-session";

export const dynamic = "force-dynamic";

export default async function SellerDraftPage() {
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
    <main className="stack">
      <AuthForm
        action="/api/seller/profile"
        method="PUT"
        title="Seller profile draft"
        submitLabel="Save draft"
        successMessage="Draft saved. Publication still waits for email verification and identity verification."
        fields={[{
          name: "displayName",
          label: "Display name",
          type: "text",
          autoComplete: "organization",
          defaultValue: profile?.displayName ?? "",
          minLength: 2,
        }]}
      />
      <p className="note">Identity status: {profile?.verificationState ?? "no profile yet"}. {session.publish}</p>
      <p><Link href="/account/products">Product drafts</Link></p>
    </main>
  );
}
