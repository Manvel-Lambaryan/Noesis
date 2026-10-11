"use client";

import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AddToCart } from "./add-to-cart";
import type { FeaturedProduct } from "./featured-products";
import { SettlingPath } from "./settling-path";
import styles from "./trending-products.module.css";

export function TrendingProducts({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="popular-week">
      <div className={styles.inner}>
        <div className={styles.copy} data-scroll="">
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
    <div className={styles.rail} data-scroll="0.28">
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
    <svg className={styles.edge} viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
      <SettlingPath fill="var(--forest-950)" from="M0 0H1440V62C1388 62 1310 62 1180 62C980 62 820 62 580 62C360 62 190 62 0 62Z" to="M0 0H1440V62C1388 78 1310 42 1180 64C980 102 820 20 580 58C360 92 190 16 0 52Z" />
      <SettlingPath stroke="var(--gold)" strokeWidth={1.4} from="M0 62C190 62 360 62 580 62C820 62 980 62 1180 62C1310 62 1388 62 1440 62" to="M0 52C190 16 360 92 580 58C820 20 980 102 1180 64C1310 42 1388 78 1440 62" />
    </svg>
  );
}

function markEdges(el: HTMLUListElement, setEdges: (value: { start: boolean; end: boolean }) => void) {
  const max = el.scrollWidth - el.clientWidth;
  setEdges({ start: el.scrollLeft <= 4, end: max <= 4 || el.scrollLeft >= max - 4 });
}
