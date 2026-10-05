"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import styles from "./home-header.module.css";

const LINKS = [
  { href: "/marketplace", label: "Marketplace", lead: true },
  { href: "#explore-categories", label: "Explore", lead: false },
  { href: "/account/seller", label: "Sell", lead: false },
  { href: "#about", label: "About", lead: false },
] as const;

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  useSearchHotkey(searchRef, close);

  return (
    <header className={styles.bar}>
      <NavBrand />
      <NavLinks className={styles.nav} label="Primary" onNavigate={close} />
      <NavSearch inputRef={searchRef} />
      <NavActions open={open} menuId={menuId} onToggle={toggle} />
      {open ? <MenuPanel id={menuId} onNavigate={close} /> : null}
    </header>
  );
}

function NavBrand() {
  return (
    <div className={styles.brandZone}>
      <Link className={styles.brand} href="/">
        <img src="/brand/noesis-mark.png" width={48} height={48} alt="" />
        <span>NOESIS</span>
      </Link>
    </div>
  );
}

function NavLinks({ id, className, label, onNavigate }: { id?: string; className: string; label: string; onNavigate: () => void }) {
  return (
    <nav id={id} className={className} aria-label={label}>
      {LINKS.map((link) => (
        <Link key={link.href} className={link.lead ? styles.lead : undefined} href={link.href} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
      <Link className={styles.panelSignIn} href="/login" onClick={onNavigate}>Sign in</Link>
    </nav>
  );
}

function NavSearch({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <form className={styles.search} action="/marketplace" role="search">
      <SearchIcon />
      <input
        ref={inputRef}
        name="q"
        type="search"
        placeholder="Search code, projects, plugins..."
        aria-label="Search the marketplace"
        autoComplete="off"
      />
      <kbd>⌘ K</kbd>
    </form>
  );
}

function NavActions({ open, menuId, onToggle }: { open: boolean; menuId: string; onToggle: () => void }) {
  return (
    <>
      <span className={styles.divider} aria-hidden="true" />
      <Link className={styles.signIn} href="/login">Sign in</Link>
      <Link className={styles.register} href="/register">
        Register <span className={styles.arrow}>→</span>
      </Link>
      <MobileMenuTrigger open={open} menuId={menuId} onToggle={onToggle} />
    </>
  );
}

function MobileMenuTrigger({ open, menuId, onToggle }: { open: boolean; menuId: string; onToggle: () => void }) {
  return (
    <button className={styles.menu} type="button" aria-expanded={open} aria-controls={menuId} onClick={onToggle}>
      <span className={styles.line} />
      <span className={styles.line} />
      <span className={styles.line} />
      <span className={styles.menuLabel}>{open ? "Close menu" : "Open menu"}</span>
    </button>
  );
}

function MenuPanel({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  return (
    <div id={id} className={styles.panel}>
      <form className={styles.panelSearch} action="/marketplace" role="search">
        <SearchIcon />
        <input name="q" type="search" placeholder="Search code, projects, plugins..." aria-label="Search the marketplace" autoComplete="off" />
      </form>
      <NavLinks className={styles.panelLinks} label="Menu" onNavigate={onNavigate} />
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
