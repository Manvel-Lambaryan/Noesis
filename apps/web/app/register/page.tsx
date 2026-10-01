import { AuthForm } from "../components/auth-form";
import { AuthGate } from "../components/auth-gate";

export default function RegisterPage() {
  return (
    <AuthGate
      kicker="Join in"
      links={[
        { href: "/login", label: "Already registered? Sign in" },
        { href: "/dev/mailbox", label: "Local mailbox" },
      ]}
    >
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
    </AuthGate>
  );
}
