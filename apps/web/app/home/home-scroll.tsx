"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HomeScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-scroll]").forEach(bindScroll);
    });
    return () => context.revert();
  }, []);
  return null;
}

function bindScroll(item: HTMLElement): void {
  gsap.fromTo(item, { y: 64, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    ease: "none",
    scrollTrigger: {
      trigger: item,
      start: "top 96%",
      end: "top 80%",
      scrub: 0.8,
    },
  });
}
