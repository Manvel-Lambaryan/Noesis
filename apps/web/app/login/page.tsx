"use client";

import { AuthForm } from "../components/auth-form";
import { AuthGate } from "../components/auth-gate";

export default function LoginPage() {
  return (
    <AuthGate
      kicker="Welcome"
      accent="back"
      links={[
        { href: "/forgot-password", label: "Forgot password?" },
        { href: "/register", label: "Create an account", tone: "accent" },
      ]}
    >
      <AuthForm
        appearance="gate"
        action="/api/auth/login"
        title="Sign in"
        submitLabel="Sign in →"
        successMessage="Signed in."
        onSuccess={() => { window.location.assign("/opening"); }}
        fields={[
          { name: "email", label: "Email", placeholder: "Enter your email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", placeholder: "Enter your password", type: "password", autoComplete: "current-password" },
        ]}
      />
    </AuthGate>
  );
}
