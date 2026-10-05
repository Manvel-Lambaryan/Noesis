import { BandHeading } from "./band-heading";
import styles from "./why-noesis.module.css";

const POINTS = [
  { title: "High-Quality Code", body: "Projects reviewed before they reach the marketplace.", icon: "M5 13l4 4L19 7" },
  { title: "Secure & Reliable", body: "Purchases stay tied to the account that bought them.", icon: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" },
  { title: "Save Time", body: "Start from a working product instead of a blank file.", icon: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" },
  { title: "Global Community", body: "Developers and businesses listing work in one place.", icon: "M4 12h16M12 4a14 14 0 0 1 0 16M12 4a14 14 0 0 0 0 16M4 8h16M4 16h16" },
] as const;

export function WhyNoesis() {
  return (
    <section id="about" className={styles.section} aria-labelledby="why-noesis">
      <div className={styles.inner} data-scroll="">
        <BandHeading
          id="why-noesis"
          eyebrow="Why NOESIS"
          title="Built for Developers. Trusted by Businesses."
          intro="A marketplace for code, templates and ready-to-launch products."
          tone="dark"
        />
        <ul className={styles.points}>
          {POINTS.map((point) => (
            <li key={point.title}>
              <PointIcon path={point.icon} />
              <strong>{point.title}</strong>
              <span>{point.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PointIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
