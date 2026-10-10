import Image from "next/image";
import Link from "next/link";
import type { ExploreCategory } from "./category-faces";
import styles from "./category-card.module.css";

export function CategoryCard({ category }: { category: ExploreCategory }) {
  const tone = category.tone === "dark" ? styles.dark : styles.light;
  return (
    <Link className={`${styles.card} ${tone}`} href={category.href}>
      <span className={styles.name}>{category.title}</span>
      <span className={styles.art}>
        <CategoryArt slug={category.slug} image={category.image} fit={category.fit} />
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </Link>
  );
}

function CategoryArt({ slug, image, fit }: { slug: string; image: string | null; fit: "contain" | "cover" }) {
  if (image !== null) {
    const frame = fit === "contain" ? styles.stage : styles.stageCover;
    return (
      <span className={frame}>
        <Image className={styles.media} src={image} alt="" fill sizes="(max-width: 700px) 78vw, 280px" />
      </span>
    );
  }
  return <Motif slug={slug} />;
}

function Motif({ slug }: { slug: string }) {
  if (slug === "authentication") return <AuthMotif />;
  if (slug === "backend-modules") return <ModuleMotif />;
  return <OrbitMotif />;
}

function AuthMotif() {
  return (
    <svg className={styles.motif} viewBox="0 0 160 180" aria-hidden="true">
      <circle cx="80" cy="78" r="28" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="80" cy="78" r="8" fill="currentColor" />
      <path d="M80 106v34M80 124h16" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ModuleMotif() {
  return (
    <svg className={styles.motif} viewBox="0 0 160 180" aria-hidden="true">
      <rect x="38" y="36" width="84" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="46" y="76" width="84" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="38" y="116" width="84" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function OrbitMotif() {
  return (
    <svg className={styles.motif} viewBox="0 0 160 180" aria-hidden="true">
      <circle cx="80" cy="90" r="36" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="80" cy="90" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="112" cy="74" r="3" fill="currentColor" />
    </svg>
  );
}
