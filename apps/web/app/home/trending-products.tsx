import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AddToCart } from "./add-to-cart";
import type { FeaturedProduct } from "./featured-products";
import styles from "./trending-products.module.css";

export function TrendingProducts({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) {
    return null;
  }
  return (
    <section className={styles.section} aria-labelledby="popular-week">
      <div className={styles.inner} data-scroll="">
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>Trending</p>
            <h2 id="popular-week">Popular This Week</h2>
            <p className={styles.intro}>Discover what developers and businesses are building with.</p>
          </div>
          <Link className={styles.more} href="/marketplace">View all →</Link>
        </div>
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
        {product.previewUrl !== null ? <img src={product.previewUrl} alt="" loading="lazy" /> : <span />}
      </Link>
      <div className={styles.copy}>
        <h3><Link href={product.href}>{product.title}</Link></h3>
        <p>{product.meta}</p>
        <div className={styles.foot}>
          <span>{product.price}</span>
          <AddToCart className={styles.cart} product={product}>
            <CartMark />
          </AddToCart>
        </div>
      </div>
    </article>
  );
}

function CartMark() {
  return <ShoppingBag strokeWidth={1.5} aria-hidden="true" />;
}
