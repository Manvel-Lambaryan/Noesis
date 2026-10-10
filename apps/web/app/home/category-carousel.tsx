"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ExploreCategory } from "./category-faces";
import { CategoryCard } from "./category-card";
import styles from "./category-carousel.module.css";

export function CategoryCarousel({ categories }: { categories: ExploreCategory[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

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
  }, [categories.length]);

  const move = (direction: number) => {
    const el = scroller.current;
    const card = el?.querySelector("li");
    if (el === null || !(card instanceof HTMLElement)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (card.clientWidth + 14), behavior: reduce ? "auto" : "smooth" });
  };

  const onKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
  };

  return (
    <div className={styles.carousel}>
      <ul
        ref={scroller}
        className={styles.track}
        tabIndex={0}
        aria-label="Categories"
        onKeyDown={onKey}
      >
        {categories.map((category) => (
          <li key={category.id}><CategoryCard category={category} /></li>
        ))}
      </ul>
      <button className={styles.prev} type="button" aria-label="Previous categories" disabled={edges.start} onClick={() => move(-1)}>
        <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      <button className={styles.next} type="button" aria-label="Next categories" disabled={edges.end} onClick={() => move(1)}>
        <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </div>
  );
}

function markEdges(el: HTMLUListElement, setEdges: (value: { start: boolean; end: boolean }) => void) {
  const max = el.scrollWidth - el.clientWidth;
  setEdges({ start: el.scrollLeft <= 4, end: max <= 4 || el.scrollLeft >= max - 4 });
}
