import Link from "next/link";
import type { FeaturedProduct } from "./featured-products";
import styles from "./ready-to-launch.module.css";

export function ReadyToLaunch({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) {
    return null;
  }
  return (
    <section className={styles.section} aria-labelledby="ready-to-launch">
      <div className={styles.inner} data-scroll="">
        <header className={styles.head}>
          <p className={styles.eyebrow}>Business ready</p>
          <h2 id="ready-to-launch">Ready to Launch</h2>
          <Link className={styles.catalog} href="/marketplace">View catalog</Link>
          <p className={styles.intro}>Applications listed for purchase. Category, description, stack and price are taken from the catalog.</p>
        </header>
        <div className={styles.grid}>
          {products.map((product) => <LaunchCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}

function LaunchCard({ product }: { product: FeaturedProduct }) {
  return (
    <article className={styles.card}>
      {product.previewUrl !== null
        ? <img className={styles.media} src={product.previewUrl} alt="" loading="lazy" />
        : <span className={styles.media} aria-hidden="true" />}
      <div className={styles.body}>
        <p className={styles.kicker}>{product.category.length > 0 ? product.category : "Listing"}</p>
        <h3>{product.title}</h3>
        <p className={styles.summary}>{product.summary.length > 0 ? product.summary : "No summary is published for this listing."}</p>
        <p className={styles.stack}>{product.meta.length > 0 ? product.meta : "Stack not listed"}</p>
        <div className={styles.foot}>
          <span>{product.price}</span>
          <Link href={product.href}>Open listing</Link>
        </div>
      </div>
    </article>
  );
}
