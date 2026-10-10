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
    <svg className={styles.foot} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
      <path fill="var(--forest-900)" d="M0 36C220 78 460 8 720 42C980 76 1200 12 1440 48V90H0Z" />
    </svg>
  );
}
