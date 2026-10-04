"use client";

import { AuthForm } from "../components/auth-form";
import { AuthGate } from "../components/auth-gate";

export default function RegisterPage() {
  return (
    <AuthGate
      fit
      kicker="Create"
      accent="account"
      links={[
        { href: "/dev/mailbox", label: "Local mailbox" },
        { href: "/login", label: "Sign in", tone: "accent" },
      ]}
    >
      <AuthForm
        appearance="gate"
        action="/api/auth/register"
        title="Create an account"
        submitLabel="Register →"
        successMessage="Account created. Check your email before you purchase. Local capture is on the mailbox page."
        onSuccess={() => { window.location.assign("/login"); }}
        fields={[
          { name: "givenName", label: "First name", placeholder: "First name", type: "text", autoComplete: "given-name", minLength: 2 },
          { name: "familyName", label: "Last name", placeholder: "Last name", type: "text", autoComplete: "family-name", minLength: 2 },
          { name: "phone", label: "Phone", placeholder: "Phone number", type: "tel", autoComplete: "tel", minLength: 4 },
          { name: "email", label: "Email", placeholder: "Enter your email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", placeholder: "Create a password", type: "password", autoComplete: "new-password" },
          { name: "confirmPassword", label: "Confirm password", placeholder: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
      />
    </AuthGate>
  );
}
