import Link from "next/link";
import { text } from "../fonts";
import { exploreCategories } from "./category-faces";
import { CategoryCarousel } from "./category-carousel";
import { ExploreDecor } from "./explore-decor";
import type { CategoryOption } from "../../lib/marketplace";
import styles from "./explore-categories.module.css";

export function ExploreCategories({ categories }: { categories: CategoryOption[] }) {
  const cards = exploreCategories(categories);
  if (cards.length === 0) return null;
  return (
    <section className={`${styles.section} ${text.className}`} aria-labelledby="explore-categories">
      <ExploreDecor />
      <div className={styles.inner}>
        <header className={styles.heading}>
          <div className={styles.lead}>
            <p className={styles.eyebrow}><span aria-hidden="true" />Browse</p>
            <h2 id="explore-categories">Explore by Category</h2>
            <p className={styles.intro}>Discover high-quality code, projects, templates and tools across a wide range of categories.</p>
          </div>
          <p className={styles.marker}>From ideas to real-world solutions</p>
          <div className={styles.aside}>
            <p>Find what you need</p>
            <Link className={styles.viewAll} href="/marketplace">
              View All Categories <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>
        <CategoryCarousel categories={cards} />
      </div>
      <ReturnEdge />
    </section>
  );
}

function ReturnEdge() {
  return (
    <svg className={styles.foot} viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
      <path fill="var(--forest-900)" d="M0 78C180 28 340 112 560 72C790 30 980 118 1200 78C1320 56 1390 96 1440 84V160H0Z" />
      <path fill="none" stroke="var(--gold)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" d="M0 78C180 28 340 112 560 72C790 30 980 118 1200 78C1320 56 1390 96 1440 84" />
    </svg>
  );
}
