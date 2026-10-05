import { Briefcase, Code, Search, UserRound } from "lucide-react";
import type { OnboardingRole } from "../../lib/onboarding";

export function RoleGlyph({ role }: { role: OnboardingRole }) {
  if (role === "business") return <Briefcase size={16} strokeWidth={1.5} aria-hidden="true" />;
  if (role === "developer") return <Code size={16} strokeWidth={1.5} aria-hidden="true" />;
  return <Search size={16} strokeWidth={1.5} aria-hidden="true" />;
}

export function UserMark() {
  return <UserRound size={16} strokeWidth={1.5} aria-hidden="true" />;
}
