import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { currentSession, ownSellerProfile, personName } from "../../lib/current-session";
import { loadWorkspace } from "../../lib/load-workspace";
import { navCounts } from "../../lib/workspace-nav";
import { ONBOARDING_COOKIE, roleTitle } from "../../lib/onboarding";
import { WorkspaceFrame } from "./workspace/frame";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await currentSession();
  if (session === null || !session.roles.includes("seller")) return children;
  const profile = await ownSellerProfile();
  const loaded = await loadWorkspace();
  const view = loaded.ok ? loaded.view : null;
  const name = personName(session.givenName, session.familyName);
  return (
    <WorkspaceFrame
      name={name || profile?.displayName || ""}
      email={session.email}
      verified={view?.checks.seller === "approved"}
      status={roleTitle((await cookies()).get(ONBOARDING_COOKIE)?.value)}
      counts={view === null ? null : navCounts(view.products)}
    >
      {children}
    </WorkspaceFrame>
  );
}
