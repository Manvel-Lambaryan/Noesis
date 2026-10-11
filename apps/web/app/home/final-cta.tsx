import Link from "next/link";
import styles from "./final-cta.module.css";

export function FinalCta() {
  return (
    <section className={styles.section} aria-labelledby="final-cta">
      <img className={styles.scene} src="/brand/join-noesis-scene.jpg" alt="" />
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.copy}>
        <p>Join NOESIS</p>
        <h2 id="final-cta">Build, Sell, and Launch the Next Big Thing.</h2>
        <p className={styles.lead}>Join developers and businesses listing code, templates and ready-to-launch products.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/register">Get Started <span aria-hidden="true">→</span></Link>
          <Link className={styles.quiet} href="/marketplace">Explore Marketplace</Link>
        </div>
      </div>
    </section>
  );
}
