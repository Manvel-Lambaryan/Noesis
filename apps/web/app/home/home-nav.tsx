"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "./cart-state";
import styles from "./home-hero.module.css";

const LINKS: { href: string; label: string; current: (path: string) => boolean }[] = [
  { href: "/", label: "Home", current: (path) => path === "/" },
  { href: "/marketplace", label: "Marketplace", current: (path) => path.startsWith("/marketplace") },
  { href: "/#explore-categories", label: "Explore", current: () => false },
  { href: "/account/seller", label: "Sell", current: (path) => path.startsWith("/account/seller") || path.startsWith("/account/products") },
  { href: "/#about", label: "About", current: () => false },
];

export function HomeNav({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const onHome = path === "/";
  const solid = useSolidNav(onHome);
  const bar = !onHome || solid ? `${styles.header} ${styles.solid} site-nav` : `${styles.header} site-nav`;
  return (
    <header className={bar}>
      <Link className={styles.brand} href="/">
        <img src="/brand/noesis-mark.png" width={36} height={36} alt="" />
        <span>NOESIS</span>
      </Link>
      <nav className={styles.nav} aria-label="Primary">
        {LINKS.map((link) => (
          <Link key={link.label} className={link.current(path) ? styles.lead : undefined} href={link.href} aria-current={link.current(path) ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <Link className={styles.search} href="/marketplace" aria-label="Search the marketplace">
          <Search strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <CartButton />
        <span className={styles.divider} aria-hidden="true" />
        {signedIn ? <ProfileLink /> : <GuestLinks />}
      </div>
    </header>
  );
}

function useSolidNav(onHome: boolean): boolean {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    if (!onHome) return;
    const explore = document.getElementById("explore-categories")?.closest("section");
    if (!explore) return;
    const update = () => setSolid(explore.getBoundingClientRect().top <= 72);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onHome]);
  return solid;
}

function CartButton() {
  const { lines, show } = useCart();
  return (
    <button className={styles.cart} type="button" aria-label="Open cart" onClick={show}>
      <ShoppingCart strokeWidth={1.75} aria-hidden="true" />
      {lines.length > 0 ? <span className={styles.count}>{lines.length}</span> : null}
    </button>
  );
}

function GuestLinks() {
  return (
    <>
      <Link className={styles.signIn} href="/login">Sign in</Link>
      <Link className={styles.register} href="/register">Register →</Link>
    </>
  );
}

function ProfileLink() {
  return (
    <Link className={styles.account} href="/account" aria-label="Open your profile">
      <UserRound strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
