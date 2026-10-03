"use client";

import { useRef } from "react";
import { display, displayItalic } from "./display-font";
import reveal from "./reveal.module.css";
import { useEditorialReveal } from "./use-editorial-reveal";
import styles from "./welcome.module.css";

export function Hero() {
  const root = useRef<HTMLDivElement>(null);
  useEditorialReveal(root);
  return (
    <div className={styles.hero} ref={root}>
      <p className={styles.eyebrow} data-reveal="eyebrow">Develop · Share · Scale</p>
      <h1 className={`${styles.heroTitle} ${display.className}`}>
        <Line>Where</Line>
        <Line>Ideas Become</Line>
        <Line italic>Real Projects</Line>
      </h1>
      <span className={styles.heroRule} data-reveal="rule" aria-hidden="true" />
      <p className={styles.heroCopy} data-reveal="copy">
        Buy and sell code, components, templates, and complete projects in one powerful marketplace.
      </p>
    </div>
  );
}

function Line({ children, italic }: { children: string; italic?: boolean }) {
  const face = italic === true ? `${styles.heroAccent} ${displayItalic.className}` : undefined;
  return (
    <span className={reveal.mask}>
      <span data-reveal="line" className={face}>{children}</span>
    </span>
  );
}
