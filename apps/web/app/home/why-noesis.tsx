import { Clock, Code, Globe, ShieldCheck, type LucideIcon } from "lucide-react";
import styles from "./why-noesis.module.css";

const POINTS: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "High-Quality Code", body: "Projects reviewed before they reach the marketplace.", icon: Code },
  { title: "Secure & Reliable", body: "Purchases stay tied to the account that bought them.", icon: ShieldCheck },
  { title: "Save Time", body: "Start from a working product instead of a blank file.", icon: Clock },
  { title: "Global Community", body: "Developers and businesses listing work in one place.", icon: Globe },
];

export function WhyNoesis() {
  return (
    <section id="about" className={styles.section} aria-labelledby="why-noesis">
      <img className={styles.scene} src="/brand/why-noesis.jpg" alt="" aria-hidden="true" />
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.inner} data-scroll="">
        <header className={styles.head}>
          <p className={styles.eyebrow}>Why NOESIS <span /></p>
          <h2 id="why-noesis">Built for Developers.<br />Trusted by Businesses.</h2>
          <p className={styles.intro}>A marketplace for code, templates and ready-to-launch products.</p>
        </header>
        <ul className={styles.points} id="docs">
          {POINTS.map((point) => <ValueCard key={point.title} point={point} />)}
        </ul>
      </div>
    </section>
  );
}

function ValueCard({ point }: { point: (typeof POINTS)[number] }) {
  const Icon = point.icon;
  return (
    <li>
      <span className={styles.arc} aria-hidden="true" />
      <span className={styles.icon} aria-hidden="true"><Icon size={18} strokeWidth={1.6} /></span>
      <strong>{point.title}</strong>
      <i className={styles.rule} aria-hidden="true" />
      <span>{point.body}</span>
    </li>
  );
}

