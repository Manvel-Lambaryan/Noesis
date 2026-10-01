"use client";

import { AuthForm } from "../components/auth-form";
import { AuthGate } from "../components/auth-gate";

export default function LoginPage() {
  return (
    <AuthGate
      kicker="Welcome back"
      links={[
        { href: "/forgot-password", label: "Forgot password" },
        { href: "/register", label: "Create an account" },
      ]}
    >
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
    </AuthGate>
  );
}
