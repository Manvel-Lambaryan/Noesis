"use client";

import { AuthForm } from "../components/auth-form";
import { AuthScreen } from "../components/auth-screen";

export default function LoginPage() {
  return (
    <AuthScreen
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
    </AuthScreen>
  );
}
