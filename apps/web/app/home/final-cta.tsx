import Link from "next/link";
import styles from "./final-cta.module.css";

export function FinalCta() {
  return (
    <section className={styles.section} aria-labelledby="final-cta">
      <img src="/brand/final-cta-desk.jpg?v=banner" alt="" loading="lazy" />
      <div className={styles.copy} data-scroll="">
        <p>Join NOESIS</p>
        <h2 id="final-cta">Build, Sell, and Launch the Next Big Thing.</h2>
        <p className={styles.lead}>Join developers and businesses listing code, templates and ready-to-launch products.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/register">Get Started →</Link>
          <Link className={styles.quiet} href="/marketplace">Explore Marketplace</Link>
        </div>
      </div>
    </section>
  );
}
