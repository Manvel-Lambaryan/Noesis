"use client";

import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type KeyboardEvent, type MouseEvent, type SetStateAction } from "react";
import Link from "next/link";
import type { FeaturedProduct, ProductTone } from "./featured-products";
import styles from "./product-carousel.module.css";

export function ProductCarousel({ products }: { products: FeaturedProduct[] }) {
  const start = Math.max(0, products.findIndex((item) => item.featured));
  const [active, setActive] = useState(start);
  const paused = useRef(false);
  const count = products.length;
  useSpin(count, setActive, paused);
  const move = (direction: -1 | 1): void => {
    setActive((current) => (current + direction + count) % count);
  };

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <button className={`${styles.arrow} ${styles.arrowLeft}`} type="button" aria-label="Previous products" onClick={() => move(-1)}>
        <Arrow direction="left" />
      </button>
      <div
        className={styles.track}
        tabIndex={0}
        role="region"
        aria-label="Featured products"
        onKeyDown={(event) => onTrackKey(event, move)}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            offset={loopOffset(index, active, count)}
            onSelect={() => setActive(index)}
          />
        ))}
      </div>
      <button className={`${styles.arrow} ${styles.arrowRight}`} type="button" aria-label="Next products" onClick={() => move(1)}>
        <Arrow direction="right" />
      </button>
    </div>
  );
}

function loopOffset(index: number, active: number, count: number): number {
  const raw = index - active;
  if (raw > count / 2) return raw - count;
  if (raw < -count / 2) return raw + count;
  return raw;
}

function useSpin(count: number, setActive: Dispatch<SetStateAction<number>>, paused: { current: boolean }): void {
  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (paused.current) return;
      setActive((current) => (current + 1) % count);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [count, paused, setActive]);
}

function onTrackKey(event: KeyboardEvent<HTMLDivElement>, move: (direction: -1 | 1) => void): void {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    move(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    move(1);
  }
}

function ProductCard({ product, offset, onSelect }: { product: FeaturedProduct; offset: number; onSelect: () => void }) {
  const quiet = offset !== 0;
  return (
    <article className={styles.card} data-rank={cardRank(offset)} style={edgeShift(offset)} onClick={() => { if (quiet) onSelect(); }}>
      {product.previewUrl !== null
        ? <img className={styles.shot} src={product.previewUrl} alt="" />
        : <span className={`${styles.shot} ${shotTone(product.tone) ?? ""}`} aria-hidden="true" />}
      <div className={styles.cardBody}>
        <h2><Link href={product.href} tabIndex={quiet ? -1 : undefined} onClick={(event) => holdSide(event, quiet, onSelect)}>{product.title}</Link></h2>
        <p>{product.meta}</p>
        <div className={styles.cardFoot}>
          <span>{product.price}</span>
          <Link className={styles.cart} href={product.href} tabIndex={quiet ? -1 : undefined} aria-label={`View ${product.title}`} onClick={(event) => holdSide(event, quiet, onSelect)}>
            <CartIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

function cardRank(offset: number): string {
  return Math.abs(offset) > 3 ? "far" : String(offset);
}

function edgeShift(offset: number): CSSProperties | undefined {
  if (Math.abs(offset) <= 3) {
    return undefined;
  }
  return { "--x": offset < 0 ? "-36" : "36" } as CSSProperties;
}

function holdSide(event: MouseEvent<HTMLAnchorElement>, quiet: boolean, onSelect: () => void): void {
  if (!quiet) {
    return;
  }
  event.preventDefault();
  onSelect();
}

function shotTone(tone: ProductTone): string | undefined {
  const tones: Record<ProductTone, string | undefined> = {
    saas: styles.saas,
    shop: styles.shop,
    kit: styles.kit,
    mobile: styles.mobile,
    admin: styles.admin,
  };
  return tones[tone];
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 7h13l-1.4 8.2H8L6.5 7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.5 7 5.2 4H2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="19.2" r="1.25" fill="currentColor" />
      <circle cx="16.8" cy="19.2" r="1.25" fill="currentColor" />
    </svg>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
