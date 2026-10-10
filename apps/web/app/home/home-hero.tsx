import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { display, displayItalic } from "../fonts";
import { PresentationRail, TrailerButton } from "./presentation-rail";
import { SectionDivider } from "./section-divider";
import styles from "./home-hero.module.css";

export function HomeHero() {
  return (
    <section className={`${styles.page} ${display.variable} home-hero`}>
      <div className={styles.stage}>
        <HeroArtwork />
        <div className={styles.scrim} aria-hidden="true" />
        <HeroCopy />
        <div className={styles.railSlot}>
          <PresentationRail />
        </div>
      </div>
      <SectionDivider />
    </section>
  );
}

function HeroCopy() {
  return (
    <div className={styles.copy}>
      <p className={styles.eyebrow}>Ideas · Code · People · Real impact</p>
      <h1 className={display.className}>NOESIS</h1>
      <h2 className={`${styles.headline} ${display.className}`}>
        Where ideas become<br />
        <em className={displayItalic.className}>real software.</em>
      </h2>
      <p className={styles.lede}>
        Buy and sell high-quality code, projects, templates and developer tools. Built by creators, for creators.
      </p>
      <HeroActions />
    </div>
  );
}

function HeroActions() {
  return (
    <div className={styles.actions}>
      <Link className={styles.primary} href="/marketplace">
        Explore Marketplace <span className={styles.arrow} aria-hidden="true">→</span>
      </Link>
      <TrailerButton className={styles.secondary}>
        <span className={styles.playMark} aria-hidden="true"><Play size={11} strokeWidth={0} fill="currentColor" /></span>
        Watch Video
      </TrailerButton>
    </div>
  );
}

function HeroArtwork() {
  return (
    <div className={styles.banner}>
      <Image
        className={styles.bannerImage}
        src="/brand/ada-lovelace-hero.webp"
        alt="Illustrated portrait of Ada Lovelace, used as the NOESIS hero banner."
        width={4096}
        height={1820}
        quality={90}
        priority
        sizes="100vw"
      />
    </div>
  );
}
