import Link from "next/link";
import styles from "./audience-split.module.css";

const DEVELOPERS = ["Sell your code, templates and tools", "Reach buyers on the marketplace", "Manage your products in one place"];
const BUSINESSES = ["Find ready-to-use solutions", "Save development time", "Focus on growing your business"];

export function AudienceSplit() {
  return (
    <section className={styles.section} aria-label="Who NOESIS is for">
      <div className={styles.split} data-scroll="">
        <Panel
          tone="dev"
          image="/brand/audience-developers.jpg"
          kicker="Developers"
          title="For Developers"
          points={DEVELOPERS}
          href="/account/seller"
          action="Start Selling"
        />
        <Panel
          tone="biz"
          image="/brand/audience-businesses.jpg"
          kicker="Businesses"
          title="For Businesses"
          points={BUSINESSES}
          href="/marketplace"
          action="Explore Marketplace"
        />
      </div>
    </section>
  );
}

function Panel({ tone, image, kicker, title, points, href, action }: {
  tone: "dev" | "biz";
  image: string;
  kicker: string;
  title: string;
  points: string[];
  href: string;
  action: string;
}) {
  return (
    <article className={tone === "dev" ? styles.dev : styles.biz}>
      <img src={image} alt="" loading="lazy" />
      <div className={styles.copy}>
        <p className={styles.kicker}>{kicker}</p>
        <h2>{title}</h2>
        <ul>{points.map((item) => <li key={item}>{item}</li>)}</ul>
        <Link href={href}>{action} →</Link>
      </div>
    </article>
  );
}
