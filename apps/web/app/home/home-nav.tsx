"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useCart } from "./cart-state";
import styles from "./site-nav.module.css";

function navLinks(seller: boolean): { href: string; label: string; current: (path: string) => boolean }[] {
  return [
    { href: "/marketplace", label: "Marketplace", current: (path) => path.startsWith("/marketplace") },
    { href: "/#explore-categories", label: "Explore", current: () => false },
    { href: seller ? "/account" : "/account/seller", label: "Sell", current: (path) => path.startsWith("/account") },
    { href: "/#about", label: "About", current: () => false },
    { href: "/#docs", label: "Docs", current: () => false },
  ];
}

export function HomeNav({ signedIn, seller, name, role }: {
  signedIn: boolean;
  seller: boolean;
  name: string;
  role: string;
}) {
  const links = navLinks(seller);
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchHotkey(searchRef, () => setOpen(false));

  return (
    <header className={`${styles.header} site-nav`}>
      <Link className={styles.brand} href="/">NOESIS</Link>
      <NavLinks links={links} path={path} className={styles.nav} />
      <div className={styles.actions}>
        <SearchForm className={styles.search} inputRef={searchRef} />
        <span className={styles.rule} aria-hidden="true" />
        <CartButton />
        {signedIn ? <ProfileLink name={name} role={role} /> : <GuestLinks />}
        <MenuButton open={open} menuId={menuId} onToggle={() => setOpen((value) => !value)} />
      </div>
      {open ? <MobilePanel id={menuId} links={links} path={path} signedIn={signedIn} onNavigate={() => setOpen(false)} /> : null}
    </header>
  );
}

function NavLinks({ links, path, className, onNavigate }: {
  links: ReturnType<typeof navLinks>;
  path: string;
  className: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className} aria-label="Primary">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          aria-current={link.current(path) ? "page" : undefined}
          onClick={onNavigate}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchForm({ className, inputRef }: { className: string; inputRef?: RefObject<HTMLInputElement | null> }) {
  return (
    <form className={className} action="/marketplace" role="search">
      <Search strokeWidth={1.75} aria-hidden="true" />
      <input ref={inputRef} name="q" type="search" placeholder="Search code, projects, plugins..." aria-label="Search the marketplace" autoComplete="off" />
      <kbd>⌘K</kbd>
    </form>
  );
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
      <Link className={styles.register} href="/register">Register <span className={styles.arrow} aria-hidden="true">→</span></Link>
    </>
  );
}

function ProfileLink({ name, role }: { name: string; role: string }) {
  const label = name.length > 0 ? name : "Profile";
  return (
    <Link className={styles.profile} href="/account" aria-label={`Open profile for ${label}`}>
      <UserRound strokeWidth={1.75} aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        {role.length > 0 ? <em>{role}</em> : null}
      </span>
    </Link>
  );
}

function MenuButton({ open, menuId, onToggle }: { open: boolean; menuId: string; onToggle: () => void }) {
  return (
    <button className={styles.menu} type="button" aria-expanded={open} aria-controls={menuId} onClick={onToggle}>
      <span />
      <span />
      <span />
      <span className={styles.menuLabel}>{open ? "Close menu" : "Open menu"}</span>
    </button>
  );
}

function MobilePanel({ id, links, path, signedIn, onNavigate }: {
  id: string;
  links: ReturnType<typeof navLinks>;
  path: string;
  signedIn: boolean;
  onNavigate: () => void;
}) {
  return (
    <div id={id} className={styles.panel}>
      <form className={styles.panelSearch} action="/marketplace" role="search">
        <Search strokeWidth={1.75} aria-hidden="true" />
        <input name="q" type="search" placeholder="Search code, projects, plugins..." aria-label="Search the marketplace" autoComplete="off" />
      </form>
      <NavLinks links={links} path={path} className={styles.nav} onNavigate={onNavigate} />
      {signedIn ? null : <Link className={`${styles.signIn} ${styles.panelSignIn}`} href="/login" onClick={onNavigate}>Sign in</Link>}
    </div>
  );
}

function useSearchHotkey(inputRef: RefObject<HTMLInputElement | null>, closeMenu: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputRef, closeMenu]);
}
