import { Caveat, Fraunces } from "next/font/google";
import type { CategoryOption } from "../../lib/marketplace";
import { exploreCategories } from "./category-faces";
import { CategoryCard } from "./category-card";
import { ExploreDecor } from "./explore-decor";
import { ExploreReveal } from "./explore-reveal";
import styles from "./explore-categories.module.css";

const display = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-display" });
const script = Caveat({ subsets: ["latin"], weight: "500" });

export function ExploreCategories({ categories }: { categories: CategoryOption[] }) {
  const cards = exploreCategories(categories);
  if (cards.length === 0) {
    return null;
  }
  return (
    <ExploreReveal>
      <section className={`${styles.section} ${display.variable}`} aria-labelledby="explore-categories">
        <ExploreDecor />
        <div className={styles.inner}>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>Discover · Build · Launch</p>
            <h2 id="explore-categories" className={`${styles.title} ${display.className}`}>Explore by Category</h2>
            <p className={styles.intro}>Find the perfect starting point for your next project. Hand-picked code, templates and tools from a global community of developers.</p>
            <p className={`${styles.script} ${script.className}`} aria-hidden="true">
              Build What&apos;s Next
              <ScriptArrow />
            </p>
          </header>
          <div className={styles.grid}>
            {cards.map((category) => <CategoryCard key={category.id} category={category} />)}
          </div>
        </div>
      </section>
    </ExploreReveal>
  );
}

function ScriptArrow() {
  return (
    <svg className={styles.scriptArrow} viewBox="0 0 84 48" fill="none" aria-hidden="true">
      <path d="M72 10C46 16 28 30 18 44" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M18 44L30 38M18 44L26 32" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}
