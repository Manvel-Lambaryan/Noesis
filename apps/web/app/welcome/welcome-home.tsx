import type { RefObject } from "react";
import Link from "next/link";
import home from "./welcome-home.module.css";

export function WelcomeHome({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  return (
    <section id="home-entry" ref={homeRef} className={home.screen} aria-label="Home">
      <div className={home.inner}>
        <p className={home.kicker}>NOESIS</p>
        <h1>One catalog for code, JavaScript and TypeScript, and ready-to-launch business apps.</h1>
        <p>Create an account to continue. Email verification is required before a purchase or a seller publication.</p>
        <p className={home.links}>
          <Link href="/marketplace">General marketplace</Link>
          <Link href="/marketplace/javascript">JavaScript and TypeScript</Link>
          <Link href="/marketplace/business-apps">Business applications</Link>
        </p>
        <p className={home.links}>
          <Link href="/register">Create an account</Link>
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
