import { BadgeCheck, Clock, Globe, ShieldCheck, type LucideIcon } from "lucide-react";
import { BandHeading } from "./band-heading";
import styles from "./why-noesis.module.css";

const POINTS: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "High-Quality Code", body: "Projects reviewed before they reach the marketplace.", icon: BadgeCheck },
  { title: "Secure & Reliable", body: "Purchases stay tied to the account that bought them.", icon: ShieldCheck },
  { title: "Save Time", body: "Start from a working product instead of a blank file.", icon: Clock },
  { title: "Global Community", body: "Developers and businesses listing work in one place.", icon: Globe },
];

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
              <PointIcon icon={point.icon} />
              <strong>{point.title}</strong>
              <span>{point.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PointIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon strokeWidth={1.5} aria-hidden="true" />;
}
