import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "NOESIS",
  description: "Developer marketplace",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link className="brand" href="/">
              <img src="/brand/noesis-mark.png" width={32} height={32} alt="" />
              NOESIS
            </Link>
            <nav>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/login">Sign in</Link>
              <Link href="/register">Register</Link>
              <Link href="/account">Account</Link>
            </nav>
          </div>
        </header>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
