"use client";

import { ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { useCart, type CartLine } from "./cart-state";
import styles from "./cart-sheet.module.css";

export function CartSheet() {
  const { lines, open, hide, remove } = useCart();
  useSheetLock(open, hide);
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={hide}>
      <aside className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={(event) => event.stopPropagation()}>
        <CartHead count={lines.length} onClose={hide} />
        {lines.length === 0 ? <EmptyCart /> : <FilledCart lines={lines} onRemove={remove} />}
      </aside>
    </div>
  );
}

function CartHead({ count, onClose }: { count: number; onClose: () => void }) {
  const label = count === 1 ? "1 piece" : `${count} pieces`;
  return (
    <header className={styles.head}>
      <div>
        <p className={styles.kicker}>Your selection</p>
        <div className={styles.titleRow}>
          <h2 id="cart-title">Cart</h2>
          <span className={styles.badge}>{label}</span>
        </div>
      </div>
      <button className={styles.close} type="button" aria-label="Close cart" onClick={onClose} autoFocus>
        <X strokeWidth={1.75} aria-hidden="true" />
      </button>
    </header>
  );
}

function EmptyCart() {
  return (
    <div className={styles.vacant}>
      <span className={styles.mark} aria-hidden="true">
        <ShoppingBag strokeWidth={1.5} />
      </span>
      <h3>Nothing saved yet</h3>
      <p>Add a project from the marketplace. It will wait here until you are ready.</p>
      <Link className={styles.browse} href="/marketplace">Browse the marketplace</Link>
    </div>
  );
}

function FilledCart({ lines, onRemove }: { lines: CartLine[]; onRemove: (id: string) => void }) {
  const saved = lines.length === 1 ? "1 project saved" : `${lines.length} projects saved`;
  return (
    <>
      <ul className={styles.list}>
        {lines.map((line) => <CartRow key={line.id} line={line} onRemove={onRemove} />)}
      </ul>
      <footer className={styles.foot}>
        <p>{saved}</p>
        <Link href="/marketplace">Keep browsing</Link>
      </footer>
    </>
  );
}

function CartRow({ line, onRemove }: { line: CartLine; onRemove: (id: string) => void }) {
  return (
    <li className={styles.row}>
      <span className={styles.shot}>
        {line.previewUrl !== null ? <img src={line.previewUrl} alt="" /> : <span className={styles.swatch} />}
      </span>
      <div className={styles.copy}>
        <Link href={line.href}>{line.title}</Link>
        {line.meta !== "" ? <p className={styles.meta}>{line.meta}</p> : null}
        <p className={styles.price}>{line.price}</p>
      </div>
      <button className={styles.remove} type="button" aria-label={`Remove ${line.title}`} onClick={() => onRemove(line.id)}>
        <Trash2 strokeWidth={1.75} aria-hidden="true" />
      </button>
    </li>
  );
}

function useSheetLock(open: boolean, hide: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [hide, open]);
}
