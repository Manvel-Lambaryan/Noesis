"use client";

import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AddToCart } from "./add-to-cart";
import type { FeaturedProduct } from "./featured-products";
import styles from "./trending-products.module.css";

export function TrendingProducts({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="popular-week">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Trending · Community Favorites</p>
          <h2 id="popular-week">Popular This Week</h2>
          <p className={styles.intro}>Discover code, templates and tools listed for builders this week.</p>
          <Link className={styles.more} href="/marketplace">View All Popular <span aria-hidden="true">→</span></Link>
        </div>
        <PopularRail products={products} />
      </div>
      <PopularEdge />
    </section>
  );
}

function PopularRail({ products }: { products: FeaturedProduct[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = scroller.current;
    if (el === null) return;
    const sync = () => markEdges(el, setEdges);
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [products.length]);

  const move = (direction: number) => scrollRail(scroller.current, direction);

  return (
    <div className={styles.rail}>
      <ul ref={scroller} className={styles.track} tabIndex={0} aria-label="Popular products" onKeyDown={(event) => onKey(event, move)}>
        {products.map((product) => (
          <li key={product.id}><TrendCard product={product} /></li>
        ))}
      </ul>
      <button className={styles.prev} type="button" aria-label="Previous products" disabled={edges.start} onClick={() => move(-1)}>
        <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      <button className={styles.next} type="button" aria-label="Next products" disabled={edges.end} onClick={() => move(1)}>
        <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </div>
  );
}

const EMPTY_PLATE = "/brand/previews/ui-components-plate.jpg";

function TrendCard({ product }: { product: FeaturedProduct }) {
  const missing = product.previewUrl === null || product.previewUrl.length === 0;
  const [plate, setPlate] = useState(missing);
  return (
    <article className={styles.card}>
      <Link className={styles.shot} href={product.href} tabIndex={-1} aria-hidden="true">
        <img src={plate ? EMPTY_PLATE : product.previewUrl ?? ""} alt="" loading="lazy" onError={() => { if (!plate) setPlate(true); }} />
      </Link>
      <div className={styles.body}>
        <h3><Link href={product.href}>{product.title}</Link></h3>
        <p>{product.meta.length > 0 ? product.meta : product.category}</p>
        <div className={styles.priceRow}>
          <span>{product.price}</span>
          <AddToCart className={styles.cart} product={product}>
            <ShoppingCart size={15} strokeWidth={1.7} aria-hidden="true" />
          </AddToCart>
        </div>
      </div>
    </article>
  );
}

function scrollRail(el: HTMLUListElement | null, direction: number) {
  const card = el?.querySelector("li");
  if (el === null || !(card instanceof HTMLElement)) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollBy({ left: direction * (card.clientWidth + 12), behavior: reduce ? "auto" : "smooth" });
}

function onKey(event: KeyboardEvent<HTMLUListElement>, move: (direction: number) => void) {
  if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
  if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
}

function PopularEdge() {
  return (
    <svg className={styles.edge} viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
      <path fill="var(--forest-900)" d="M0 68C200 24 390 112 640 64C900 14 1100 118 1300 72C1372 52 1416 84 1440 74V160H0Z" />
      <path fill="none" stroke="var(--gold)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" d="M0 68C200 24 390 112 640 64C900 14 1100 118 1300 72C1372 52 1416 84 1440 74" />
      <path fill="none" stroke="var(--gold)" strokeWidth="0.7" opacity="0.42" vectorEffect="non-scaling-stroke" d="M0 84C220 46 410 124 660 80C920 34 1120 128 1320 88C1384 70 1420 96 1440 90" />
    </svg>
  );
}

function markEdges(el: HTMLUListElement, setEdges: (value: { start: boolean; end: boolean }) => void) {
  const max = el.scrollWidth - el.clientWidth;
  setEdges({ start: el.scrollLeft <= 4, end: max <= 4 || el.scrollLeft >= max - 4 });
}
