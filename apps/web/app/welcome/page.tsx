import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDING_COOKIE, onboardingRedirect, parseOnboarding } from "../../lib/onboarding";
import { SESSION_COOKIE } from "../../lib/session-cookie";
import { WelcomeFlow } from "./welcome-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome · NOESIS",
  description: "Tell us how you want to use the NOESIS developer marketplace.",
  robots: { index: false, follow: false },
};

export default async function WelcomePage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const registered = typeof token === "string" && token.length > 0;
  const target = onboardingRedirect("/welcome", registered);
  if (target !== null) {
    redirect(target);
  }
  return <WelcomeFlow initial={parseOnboarding(jar.get(ONBOARDING_COOKIE)?.value)} signedIn={registered} />;
}
