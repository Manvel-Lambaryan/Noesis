"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ShoppingCart, Users, Zap, type LucideIcon } from "lucide-react";
import { script } from "../fonts";
import { AddToCart } from "./add-to-cart";
import type { FeaturedProduct } from "./featured-products";
import styles from "./ready-to-launch.module.css";

const VALUES: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Launch Faster", body: "Skip the setup. Start building.", icon: Zap },
  { title: "Production Ready", body: "Clean code, documentation and best practices.", icon: BadgeCheck },
  { title: "Built by Developers", body: "Trusted by a global community.", icon: Users },
];

export function ReadyToLaunch({ products }: { products: FeaturedProduct[] }) {
  const cards = products.slice(0, 3);
  if (cards.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="ready-to-launch">
      <LaunchDecor />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Deploy · Customize · Scale</p>
          <h2 id="ready-to-launch">Ready to Launch</h2>
          <p className={styles.intro}>Production-ready code, templates and tools to turn your ideas into reality — faster.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/marketplace">
              Explore Launch-Ready Projects <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondary} href="/#about">How It Works</Link>
          </div>
          <ul className={styles.values}>
            {VALUES.map((item) => (
              <li key={item.title}>
                <span className={styles.valueIcon} aria-hidden="true"><item.icon size={15} strokeWidth={1.6} /></span>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.stage}>
          <p className={styles.featured}>Featured</p>
          <div className={styles.grid}>
            {cards.map((product) => <LaunchCard key={product.id} product={product} />)}
          </div>
          <p className={`${styles.script} ${script.className}`} aria-hidden="true">Ideas to Reality Faster</p>
        </div>
      </div>
      <LaunchEdge />
    </section>
  );
}

function LaunchCard({ product }: { product: FeaturedProduct }) {
  return (
    <article className={styles.card}>
      <div className={styles.shot}>
        <LaunchShot src={product.previewUrl} />
        {product.featured ? <em className={styles.badge}>Featured</em> : null}
      </div>
      <div className={styles.body}>
        <p className={styles.kicker}>{product.category.length > 0 ? product.category : "Listing"}</p>
        <h3><Link href={product.href}>{product.title}</Link></h3>
        <p className={styles.stack}>{product.meta.length > 0 ? product.meta : "Stack not listed"}</p>
        <p className={styles.summary}>{product.summary.length > 0 ? product.summary : "No summary is published for this listing."}</p>
        <div className={styles.priceRow}>
          <span>{product.price}</span>
          <AddToCart product={product} className={styles.cart}><ShoppingCart size={16} strokeWidth={1.75} /></AddToCart>
        </div>
      </div>
    </article>
  );
}

const EMPTY_PLATE = "/brand/previews/ui-components-plate.jpg";

function LaunchShot({ src }: { src: string | null }) {
  const missing = src === null || src.length === 0;
  const [plate, setPlate] = useState(missing);
  const [failed, setFailed] = useState(false);
  if (failed) return <PlateMark />;
  return (
    <img
      src={plate ? EMPTY_PLATE : src ?? ""}
      alt=""
      loading="lazy"
      onError={() => (plate ? setFailed(true) : setPlate(true))}
    />
  );
}

function PlateMark() {
  return (
    <span className={styles.placeholder} aria-hidden="true">
      <svg viewBox="0 0 120 80" fill="none">
        <circle cx="60" cy="40" r="30" stroke="currentColor" strokeWidth="0.7" opacity="0.45" />
        <circle cx="60" cy="40" r="20" stroke="currentColor" strokeWidth="0.7" />
        <path d="M60 18c2 8 8 13 16 16-8 2-13 8-16 16-2-8-8-13-16-16 8-2 13-8 16-16Z" fill="currentColor" />
      </svg>
    </span>
  );
}

function LaunchDecor() {
  return (
    <div className={styles.decor} aria-hidden="true">
      <svg className={styles.sprig} viewBox="0 0 180 280" fill="none">
        <path d="M92 268C90 190 74 128 92 18" stroke="currentColor" strokeWidth="1.2" />
        <path d="M92 214C48 192 24 156 36 122C70 144 90 178 92 214Z" fill="currentColor" />
        <path d="M92 168C140 146 168 112 158 78C122 100 98 134 92 168Z" fill="currentColor" />
      </svg>
    </div>
  );
}

function LaunchEdge() {
  return (
    <svg className={styles.edge} viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
      <path fill="var(--forest-950)" d="M0 52C190 16 360 92 580 58C820 20 980 102 1180 64C1310 42 1388 78 1440 62V150H0Z" />
      <path fill="none" stroke="var(--gold)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" d="M0 52C190 16 360 92 580 58C820 20 980 102 1180 64C1310 42 1388 78 1440 62" />
    </svg>
  );
}
