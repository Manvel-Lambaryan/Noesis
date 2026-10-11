import { BarChart3, Clock, Code2, Layers, Package, Users, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./audience-split.module.css";

type Point = { icon: LucideIcon; text: string };

const DEVELOPERS: Point[] = [
  { icon: Code2, text: "Sell your code, templates and tools" },
  { icon: Users, text: "Reach buyers on the marketplace" },
  { icon: Layers, text: "Manage your products in one place" },
];

const BUSINESSES: Point[] = [
  { icon: Package, text: "Find ready-to-use solutions" },
  { icon: Clock, text: "Save development time" },
  { icon: BarChart3, text: "Focus on growing your business" },
];

export function AudienceSplit() {
  return (
    <section className={styles.section} aria-label="Who NOESIS is for">
      <div className={styles.split}>
        <Panel image="/brand/audience-developers-scene.jpg" kicker="Developers" title="For Developers" points={DEVELOPERS} href="/account/seller" action="Start Selling" tone="primary" />
        <Panel image="/brand/audience-businesses-scene.jpg" kicker="Businesses" title="For Businesses" points={BUSINESSES} href="/marketplace" action="Explore Marketplace" tone="quiet" />
      </div>
    </section>
  );
}

function Panel({ image, kicker, title, points, href, action, tone }: {
  image: string;
  kicker: string;
  title: string;
  points: Point[];
  href: string;
  action: string;
  tone: "primary" | "quiet";
}) {
  return (
    <article className={styles.card}>
      <div className={styles.scene}>
        <Image src={image} alt="" fill sizes="(max-width: 900px) 100vw, 46vw" quality={75} className={styles.photo} />
        <div className={styles.veil} />
        <Curves id={kicker} />
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>{kicker}</p>
        <h2>{title}</h2>
        <ul>{points.map((point) => <Benefit key={point.text} point={point} />)}</ul>
        <Link className={tone === "primary" ? styles.primary : styles.quiet} href={href}>
          {action} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function Benefit({ point }: { point: Point }) {
  const Icon = point.icon;
  return (
    <li>
      <span className={styles.icon} aria-hidden="true"><Icon size={16} strokeWidth={1.6} /></span>
      <span>{point.text}</span>
    </li>
  );
}

function Curves({ id }: { id: string }) {
  const paint = `${id}-gold`;
  return (
    <svg className={styles.curves} viewBox="0 0 800 460" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={paint} x1="800" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c6a96e" stopOpacity="0.5" />
          <stop offset="0.62" stopColor="#c6a96e" stopOpacity="0.14" />
          <stop offset="1" stopColor="#c6a96e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M430 24C560 78 540 168 760 108" fill="none" stroke={`url(#${paint})`} strokeWidth="1.1" />
      <path d="M390 430C560 360 650 390 790 250" fill="none" stroke={`url(#${paint})`} strokeWidth="0.7" />
      <circle cx="734" cy="118" r="46" fill="none" stroke={`url(#${paint})`} strokeWidth="0.6" />
    </svg>
  );
}
