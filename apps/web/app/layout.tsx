import type { ReactNode } from "react";
import type { Viewport } from "next";
import { ZoomLock } from "./components/zoom-lock";
import { CartRoot } from "./home/cart-root";
import { HomeNav } from "./home/home-nav";
import { currentSession } from "../lib/current-session";
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
  return (
    <html lang="en">
      <body>
        <ZoomLock />
        <CartRoot>
          <HomeNav signedIn={session !== null} />
          <div className="wrap">{children}</div>
        </CartRoot>
      </body>
    </html>
  );
}
