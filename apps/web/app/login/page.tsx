"use client";

import Link from "next/link";
import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <main className="stack">
      <AuthForm
        action="/api/auth/login"
        title="Sign in"
        submitLabel="Sign in"
        successMessage="Signed in."
        onSuccess={() => { window.location.assign("/account"); }}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="note">
        <Link href="/forgot-password">Forgot password</Link>
        {" · "}
        <Link href="/register">Create an account</Link>
      </p>
    </main>
  );
}
