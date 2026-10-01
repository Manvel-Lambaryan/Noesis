import Link from "next/link";
import { AuthForm } from "../components/auth-form";

export default function RegisterPage() {
  return (
    <main className="stack">
      <AuthForm
        action="/api/auth/register"
        title="Create an account"
        submitLabel="Register"
        successMessage="Account created. Check your email before you purchase. Local capture is on the mailbox page."
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="note">
        <Link href="/login">Already registered? Sign in</Link>
        {" · "}
        <Link href="/dev/mailbox">Local mailbox</Link>
      </p>
    </main>
  );
}
