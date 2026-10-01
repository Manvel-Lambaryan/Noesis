"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Monsieur_La_Doulaise } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { MAC_KEYS } from "./mac-keys";
import styles from "./auth-gate.module.css";
import { useLaptopOpen } from "./use-laptop-open";

const script = Monsieur_La_Doulaise({ weight: "400", subsets: ["latin"] });
const EASE = [0.22, 1, 0.36, 1] as const;

export function AuthGate({
  kicker,
  links,
  children,
}: {
  kicker: string;
  links: { href: string; label: string }[];
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const hidden = reduce ? false : { opacity: 0, y: 18 };

  return (
    <div className={`${styles.stage} auth-shell`}>
      <motion.aside
        className={styles.aside}
        initial={hidden}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Wordmark reduce={reduce === true} />
        <p className={styles.kicker}>{kicker}</p>
        <p className={styles.lede}>Code, components, and business apps in one catalog.</p>
      </motion.aside>
      <motion.main
        className={styles.main}
        initial={hidden}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: reduce ? 0 : 0.08, ease: EASE }}
      >
        <Laptop>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Member access</p>
            <div className={styles.form}>{children}</div>
            <nav className={styles.links} aria-label="Account">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              ))}
            </nav>
          </section>
        </Laptop>
      </motion.main>
    </div>
  );
}

const NAME = "Noesis".split("");

function Wordmark({ reduce }: { reduce: boolean }) {
  return (
    <p className={`${styles.wordmark} ${script.className}`} aria-label="Noesis">
      {NAME.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          aria-hidden="true"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 + index * 0.32, ease: EASE }}
        >
          {letter}
        </motion.span>
      ))}
    </p>
  );
}

function Laptop({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion() === true;
  const [ready, setReady] = useState(reduce);
  const { rig, lid } = useLaptopOpen(reduce, () => setReady(true));

  return (
    <div className={styles.laptop}>
      <div ref={rig} className={styles.rig}>
      <div ref={lid} className={styles.lid} style={{ transformOrigin: "center bottom" }}>
        <div className={styles.lidBack} aria-hidden="true" />
        <div className={styles.face}>
          <span className={styles.camera} aria-hidden="true" />
          <div className={styles.screen} inert={!ready}>{children}</div>
        </div>
      </div>
      <div className={styles.base} aria-hidden="true">
      <div className={styles.hinge} />
      <div className={styles.deck}>
        <div className={styles.board}>
          {MAC_KEYS.map((keys) => (
            <div key={keys.map((key) => key.label).join("")} className={styles.row}>
              {keys.map((key, index) => (
                <span key={`${key.label}-${index}`} className={styles.key} style={{ flexGrow: key.grow ?? 1 }}>{key.label}</span>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.pad} />
      </div>
      </div>
      </div>
    </div>
  );
}
