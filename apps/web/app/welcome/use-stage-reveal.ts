"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

export function useStageReveal(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const node = root.current;
    if (node === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      playStage(node);
    }, node);
    return () => ctx.revert();
  }, [root]);
}

function playStage(node: HTMLElement): void {
  const header = node.querySelector("[data-reveal='header']");
  const panel = node.querySelector("[data-reveal='panel']");
  const cards = node.querySelectorAll("[data-reveal='card']");
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (header !== null) timeline.from(header, { autoAlpha: 0, y: -8, duration: 0.55, clearProps: "all" });
  if (panel !== null) timeline.from(panel, { autoAlpha: 0, duration: 0.6, clearProps: "all" }, 0.08);
  if (cards.length > 0) timeline.from(cards, { autoAlpha: 0, stagger: 0.06, duration: 0.4, clearProps: "all" }, 0.22);
}
