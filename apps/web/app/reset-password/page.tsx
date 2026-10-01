"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "../components/auth-form";

export default function ResetPasswordPage() {
  const token = useQueryToken();
  return (
    <AuthForm
      key={token}
      action="/api/auth/password-resets"
      title="Choose a new password"
      submitLabel="Update password"
      successMessage="Password updated. Sign in with the new password."
      fields={[
        { name: "token", label: "Reset token", type: "text", autoComplete: "off", defaultValue: token },
        { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
      ]}
    />
  );
}

function useQueryToken(): string {
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);
  return token;
}
