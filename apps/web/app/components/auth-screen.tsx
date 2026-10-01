import type { ReactNode } from "react";
import Link from "next/link";
import chrome from "../welcome/chrome.module.css";
import styles from "./auth-screen.module.css";

export function AuthScreen({
  children,
  links,
}: {
  children: ReactNode;
  links: { href: string; label: string }[];
}) {
  return (
    <div className={`${styles.shell} auth-shell`}>
      <header className={chrome.header}>
        <Link className={chrome.brand} href="/">
          <img className={chrome.mark} src="/brand/noesis-mark.png" width={40} height={40} alt="" />
          <span>
            <span className={chrome.brandName}>NOESIS</span>
            <span className={chrome.brandTag}>The developer marketplace</span>
          </span>
        </Link>
      </header>
      <main className={styles.main}>
        <section className={styles.panel}>
          {children}
          <p className={styles.links}>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </p>
        </section>
      </main>
    </div>
  );
}
