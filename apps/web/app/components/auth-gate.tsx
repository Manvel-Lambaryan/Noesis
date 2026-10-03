"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import styles from "./auth-gate.module.css";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"] });
const italic = Fraunces({ subsets: ["latin"], style: "italic", weight: "500" });
const EASE = [0.22, 1, 0.36, 1] as const;

type GateLink = { href: string; label: string; tone?: "accent" };

export function AuthGate({
  kicker,
  accent,
  links,
  children,
}: {
  kicker: string;
  accent: string;
  links: GateLink[];
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const hidden = reduce ? false : { opacity: 0, y: 16 };

  return (
    <div className={`${styles.stage} ${display.className} auth-shell`}>
      <motion.aside
        className={styles.aside}
        initial={hidden}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <Brand />
        <h1 className={styles.kicker}>
          {kicker}
          <span className={`${styles.accent} ${italic.className}`}>{accent}</span>
        </h1>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.lede}>Code, components, and business apps in one catalog.</p>
      </motion.aside>
      <motion.main
        className={styles.main}
        initial={hidden}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: reduce ? 0 : 0.08, ease: EASE }}
      >
        <GatePanel links={links}>{children}</GatePanel>
      </motion.main>
    </div>
  );
}

function GatePanel({ links, children }: { links: GateLink[]; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <div className={styles.art} aria-hidden="true">
        <img src="/brand/signin-box.jpg" alt="" />
      </div>
      <div className={styles.surface}>
        <p className={styles.eyebrow}>Member access</p>
        <div className={styles.form}>{children}</div>
        <ContinueWith />
        <nav className={styles.links} aria-label="Account">
          {links.map((link) => (
            <Link key={link.href} href={link.href} data-tone={link.tone}>{link.label}</Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <div className={styles.brand}>
      <img src="/brand/noesis-mark.png" width={36} height={36} alt="" />
      <span>
        <span className={styles.brandName}>NOESIS</span>
        <span className={styles.brandTag}>The developer marketplace</span>
      </span>
    </div>
  );
}

function ContinueWith() {
  return (
    <div className={styles.continue}>
      <p><span>Or continue with</span></p>
      <div className={styles.social}>
        <Social name="Google" />
        <Social name="GitHub" />
        <Social name="LinkedIn" />
      </div>
    </div>
  );
}

function Social({ name }: { name: string }) {
  return (
    <button className={styles.socialButton} type="button" disabled>
      <Mark name={name} />
      <span className={styles.socialName}>{name}</span>
    </button>
  );
}

function Mark({ name }: { name: string }) {
  if (name === "Google") return <GoogleMark />;
  if (name === "GitHub") return <GitHubMark />;
  return <LinkedInMark />;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.1 14.3A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.6.4-2.3v-3H1.3A12 12 0 0 0 0 12c0 1.9.5 3.8 1.3 5.3l3.8-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.7l3.8 3C6.1 7 8.8 4.8 12 4.8z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#5c4033" d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.4 9.4 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.4 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#8b5a3c" d="M4.7 9h3.1v10H4.7zM6.2 3.8a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10.2 9h3v1.4c.5-.9 1.6-1.6 3.2-1.6 3.2 0 3.8 2.1 3.8 4.8V19h-3.1v-5c0-1.2 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.6V19h-3.3z" />
    </svg>
  );
}
