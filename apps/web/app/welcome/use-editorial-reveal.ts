"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

export function useEditorialReveal(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const node = root.current;
    if (node === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      playReveal(node);
    }, node);
    return () => ctx.revert();
  }, [root]);
}

function playReveal(node: HTMLElement): void {
  const eyebrow = node.querySelector("[data-reveal='eyebrow']");
  const lines = node.querySelectorAll("[data-reveal='line']");
  const rule = node.querySelector("[data-reveal='rule']");
  const copy = node.querySelector("[data-reveal='copy']");
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (eyebrow !== null) timeline.from(eyebrow, { autoAlpha: 0, y: 8, duration: 0.45 });
  timeline.from(lines, { yPercent: 110, duration: 0.85, stagger: 0.1 }, "-=0.15");
  if (rule !== null) timeline.from(rule, { scaleX: 0, duration: 0.45 }, "-=0.35");
  if (copy !== null) timeline.from(copy, { autoAlpha: 0, y: 12, duration: 0.55 }, "-=0.25");
}
