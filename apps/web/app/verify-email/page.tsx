"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "../components/auth-form";

export default function VerifyEmailPage() {
  const token = useQueryToken();
  return (
    <main className="stack">
      <AuthForm
        key={token}
        action="/api/auth/email-verifications"
        title="Verify your email"
        submitLabel="Verify"
        successMessage="Email verified. You can purchase once you are signed in."
        fields={[{ name: "token", label: "Verification token", type: "text", autoComplete: "off", defaultValue: token }]}
      />
      <AuthForm
        action="/api/auth/email-verifications"
        title="Resend verification"
        submitLabel="Send a new link"
        successMessage="If that account still needs verification, a new link is on the way."
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      />
    </main>
  );
}

function useQueryToken(): string {
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);
  return token;
}
