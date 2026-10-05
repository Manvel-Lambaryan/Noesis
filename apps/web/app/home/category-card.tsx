import Link from "next/link";
import type { ExploreCategory } from "./category-faces";
import styles from "./explore-categories.module.css";

export function CategoryCard({ category }: { category: ExploreCategory }) {
  const tone = category.tone === "dark" ? styles.dark : styles.light;
  const span = category.span === "feature" ? styles.feature : category.span === "wide" ? styles.wide : styles.regular;
  return (
    <Link className={`${styles.card} ${tone} ${span}`} href={category.href}>
      <img className={styles.media} src={category.image} alt="" loading="lazy" />
      <span className={styles.shade} aria-hidden="true" />
      <span className={styles.copy}>
        <CategoryIcon slug={category.slug} />
        <span className={styles.name}>{category.title}</span>
        <span className={styles.blurb}>{category.description}</span>
        <span className={styles.arrow} aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

function CategoryIcon({ slug }: { slug: string }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d={glyph(slug)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function glyph(slug: string): string {
  const paths: Record<string, string> = {
    "business-applications": "M4 8h16v11H4zM8 8V6h8v2M8 12h8M8 15h5",
    dashboards: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
    "e-commerce": "M6 7h12l-1 12H7L6 7zM9 7V5h6v2",
    "ui-components": "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM15 15h2M17 13v6",
    "api-integrations": "M8 12H4M16 12h4M9 8l-3 4 3 4M15 8l3 4-3 4M10 12h4",
    "mobile-applications": "M8 3h8v18H8zM11 18h2",
    "website-templates": "M4 6h16v12H4zM4 10h16M8 6v4",
    "developer-tools": "M14 6l4 4-8 8H6v-4z",
  };
  return paths[slug] ?? "M5 12h14";
}
