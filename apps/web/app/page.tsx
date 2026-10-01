import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { onboardingRedirect } from "../lib/onboarding";
import { SESSION_COOKIE } from "../lib/session-cookie";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const target = onboardingRedirect("/", typeof token === "string" && token.length > 0);
  if (target !== null) {
    redirect(target);
  }

  return (
    <main className="stack">
      <h1>NOESIS</h1>
      <p>One catalog for code, JavaScript and TypeScript, and ready-to-launch business apps.</p>
      <p className="note">Create an account to continue. Email verification is required before a purchase or a seller publication.</p>
      <p>
        <Link href="/marketplace">General marketplace</Link>
        {" · "}
        <Link href="/marketplace/javascript">JavaScript and TypeScript</Link>
        {" · "}
        <Link href="/marketplace/business-apps">Business applications</Link>
      </p>
      <p>
        <Link href="/register">Create an account</Link>
        {" · "}
        <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
