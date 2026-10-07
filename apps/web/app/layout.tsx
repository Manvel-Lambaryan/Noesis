import type { ReactNode } from "react";
import type { Viewport } from "next";
import { cookies } from "next/headers";
import { ZoomLock } from "./components/zoom-lock";
import { CartRoot } from "./home/cart-root";
import { HomeNav } from "./home/home-nav";
import { currentSession, personName } from "../lib/current-session";
import { ONBOARDING_COOKIE, roleTitle } from "../lib/onboarding";
import "./globals.css";

export const metadata = {
  title: "NOESIS",
  description: "Developer marketplace",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await currentSession();
  const name = session === null ? "" : personName(session.givenName, session.familyName);
  const role = roleTitle((await cookies()).get(ONBOARDING_COOKIE)?.value);
  return (
    <html lang="en">
      <body>
        <ZoomLock />
        <CartRoot>
          <HomeNav signedIn={session !== null} seller={session?.roles.includes("seller") ?? false} name={name} role={role} />
          <div className="wrap">{children}</div>
        </CartRoot>
      </body>
    </html>
  );
}
