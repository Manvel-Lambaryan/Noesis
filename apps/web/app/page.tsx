import Link from "next/link";

export default function HomePage() {
  return (
    <main className="stack">
      <h1>NOESIS</h1>
      <p>One catalog for code, JavaScript and TypeScript, and ready-to-launch business apps.</p>
      <p className="note">Create an account to continue. Email verification is required before a purchase or a seller publication.</p>
      <p>
        <Link href="/register">Create an account</Link>
        {" · "}
        <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
