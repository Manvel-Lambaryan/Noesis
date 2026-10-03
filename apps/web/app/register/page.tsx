import { AuthForm } from "../components/auth-form";
import { AuthGate } from "../components/auth-gate";

export default function RegisterPage() {
  return (
    <AuthGate
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
        fields={[
          { name: "email", label: "Email", placeholder: "Enter your email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", placeholder: "Create a password", type: "password", autoComplete: "new-password" },
        ]}
      />
    </AuthGate>
  );
}
