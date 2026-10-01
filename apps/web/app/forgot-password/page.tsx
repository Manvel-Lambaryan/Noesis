import Link from "next/link";
import { AuthForm } from "../components/auth-form";

export default function ForgotPasswordPage() {
  return (
    <main className="stack">
      <AuthForm
        action="/api/auth/password-resets"
        title="Reset your password"
        submitLabel="Send reset link"
        successMessage="If an account exists for that email, a reset link is on the way."
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      />
      <p className="note"><Link href="/dev/mailbox">Local mailbox</Link></p>
    </main>
  );
}
