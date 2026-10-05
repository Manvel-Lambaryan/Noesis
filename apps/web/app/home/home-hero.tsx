import Link from "next/link";
import { Fraunces } from "next/font/google";
import type { FeaturedProduct } from "./featured-products";
import { ProductCarousel } from "./product-carousel";
import styles from "./home-hero.module.css";

const display = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-display" });

export function HomeHero({ products }: { products: FeaturedProduct[] }) {
  return (
    <section className={`${styles.page} ${display.variable} home-hero`}>
      <div className={styles.shell}>
        <img className={styles.scene} src="/brand/home-hero-scene-4x.webp" alt="" />
        <div className={styles.vignette} />
        <HeroHeader />
        <HeroBrand />
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}

function HeroHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/">
        <img src="/brand/noesis-mark.png" width={36} height={36} alt="" />
        <span>NOESIS</span>
      </Link>
      <nav className={styles.nav} aria-label="Primary">
        <Link className={styles.lead} href="/marketplace">Marketplace</Link>
        <Link href="#explore-categories">Explore</Link>
        <Link href="/account/seller">Sell</Link>
        <a href="#about">About</a>
      </nav>
      <div className={styles.actions}>
        <Link className={styles.search} href="/marketplace" aria-label="Search the marketplace">
          <SearchIcon />
        </Link>
        <Link className={styles.signIn} href="/login">Sign in</Link>
        <Link className={styles.register} href="/register">Register →</Link>
      </div>
    </header>
  );
}

function HeroBrand() {
  return (
    <div className={`${styles.brandBlock} ${display.className}`}>
      <h1>NOESIS</h1>
      <span className={styles.rule} />
      <p className={styles.kicker}>Code & projects marketplace</p>
      <p className={styles.copy}>Buy and sell high-quality code, templates, plugins and complete projects.</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
