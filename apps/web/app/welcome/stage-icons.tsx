import type { OnboardingRole } from "../../lib/onboarding";

export function RoleGlyph({ role }: { role: OnboardingRole }) {
  if (role === "business") return <Briefcase />;
  if (role === "developer") return <CodeMark />;
  return <SearchMark />;
}

export function UserMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="5.2" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.4 13.2c.7-2.2 2.3-3.3 4.6-3.3s3.9 1.1 4.6 3.3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Briefcase() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.2" y="5.2" width="11.6" height="8" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 5.2V3.8A1.3 1.3 0 0 1 7.3 2.5h1.4A1.3 1.3 0 0 1 10 3.8v1.4M2.2 8.4h11.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CodeMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 4.2 2.8 8 6 11.8M10 4.2 13.2 8 10 11.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7.2" cy="7.2" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 10.2 13.2 13.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
