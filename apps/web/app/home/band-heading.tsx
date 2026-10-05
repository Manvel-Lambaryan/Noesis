import Link from "next/link";
import styles from "./home-band.module.css";

type BandHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  tone: "light" | "dark";
  href?: string;
  action?: string;
};

export function BandHeading({ id, eyebrow, title, intro, tone, href, action }: BandHeadingProps) {
  return (
    <div className={`${styles.row} ${tone === "dark" ? styles.dark : styles.light}`}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id={id} className={styles.title}>{title}</h2>
        <p className={styles.intro}>{intro}</p>
      </div>
      {href !== undefined && action !== undefined ? <Link className={styles.more} href={href}>{action}</Link> : null}
    </div>
  );
}
