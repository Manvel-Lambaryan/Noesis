import Link from "next/link";
import type { FeaturedProduct } from "./featured-products";
import { BandHeading } from "./band-heading";
import styles from "./trending-products.module.css";

export function TrendingProducts({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) {
    return null;
  }
  return (
    <section className={styles.section} aria-labelledby="popular-week">
      <div className={styles.inner} data-scroll="">
        <BandHeading
          id="popular-week"
          eyebrow="Trending"
          title="Popular This Week"
          intro="A closer look at projects currently listed on the marketplace."
          tone="light"
          href="/marketplace"
          action="View all →"
        />
        <div className={styles.scroller} tabIndex={0} role="region" aria-label="Popular products">
          {products.map((product) => <TrendCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}

function TrendCard({ product }: { product: FeaturedProduct }) {
  return (
    <article className={styles.card}>
      <Link className={styles.shot} href={product.href} tabIndex={-1} aria-hidden="true">
        {product.previewUrl !== null
          ? <img src={product.previewUrl} alt="" loading="lazy" />
          : <span />}
      </Link>
      <div className={styles.copy}>
        <h3><Link href={product.href}>{product.title}</Link></h3>
        <p>{product.meta}</p>
        <div className={styles.foot}>
          <span>{product.price}</span>
          <Link className={styles.cart} href={product.href} aria-label={`View ${product.title}`}>
            <CartMark />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CartMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 7h13l-1.4 8.2H8L6.5 7Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 7 5.2 4H2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
