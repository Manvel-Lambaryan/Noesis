import Link from "next/link";
import { AppWindow, ArrowUpRight, Blocks, Briefcase, Code2, LayoutDashboard, ShoppingBag, Smartphone, Workflow, type LucideIcon } from "lucide-react";
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
        <span className={styles.arrow} aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.75} /></span>
      </span>
    </Link>
  );
}

const ICONS: Record<string, LucideIcon> = {
  "business-applications": Briefcase,
  dashboards: LayoutDashboard,
  "e-commerce": ShoppingBag,
  "ui-components": Blocks,
  "api-integrations": Workflow,
  "mobile-applications": Smartphone,
  "website-templates": AppWindow,
  "developer-tools": Code2,
};

function CategoryIcon({ slug }: { slug: string }) {
  const Icon = ICONS[slug] ?? Code2;
  return <Icon className={styles.icon} strokeWidth={1.5} aria-hidden="true" />;
}
