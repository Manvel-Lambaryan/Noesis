"use client";

export function SignOutButton() {
  async function signOut(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return <button type="button" onClick={() => void signOut()}>Sign out</button>;
}
