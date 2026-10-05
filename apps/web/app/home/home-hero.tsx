import type { FeaturedProduct } from "./featured-products";
import { display } from "../fonts";
import { ProductCarousel } from "./product-carousel";
import styles from "./home-hero.module.css";

export function HomeHero({ products }: { products: FeaturedProduct[] }) {
  return (
    <section className={`${styles.page} ${display.variable} home-hero`}>
      <div className={styles.shell}>
        <img className={styles.scene} src="/brand/home-hero-scene-4x.webp" alt="" />
        <div className={styles.vignette} />
        <div className={styles.navSpace} aria-hidden="true" />
        <HeroBrand />
        <ProductCarousel products={products} />
      </div>
    </section>
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

