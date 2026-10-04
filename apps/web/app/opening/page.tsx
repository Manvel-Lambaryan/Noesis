import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ENTERED_COOKIE, JOINED_COOKIE, onboardingRedirect } from "../../lib/onboarding";
import { SESSION_COOKIE } from "../../lib/session-cookie";
import { OpeningFilm } from "./opening-film";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome · NOESIS",
  robots: { index: false, follow: false },
};

export default async function OpeningPage() {
  const jar = await cookies();
  const target = onboardingRedirect("/opening", {
    registered: typeof jar.get(SESSION_COOKIE)?.value === "string" && (jar.get(SESSION_COOKIE)?.value.length ?? 0) > 0,
    entered: jar.get(ENTERED_COOKIE)?.value === "1",
    joined: jar.get(JOINED_COOKIE)?.value === "1",
  });
  if (target !== null) {
    redirect(target);
  }
  return <OpeningFilm />;
}
