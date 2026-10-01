"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function useLaptopOpen(reduce: boolean, markReady: () => void) {
  const rig = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const finish = useRef(markReady);
  finish.current = markReady;

  useGSAP(() => {
    const deck = rig.current;
    const cover = lid.current;
    if (deck === null || cover === null) return;
    if (reduce) {
      gsap.set(deck, { opacity: 1, y: 0, scale: 1 });
      gsap.set(cover, { rotationX: 0 });
      finish.current();
      return;
    }
    gsap.set(deck, { opacity: 0, y: 48, scale: 0.9 });
    gsap.set(cover, { rotationX: -90, transformOrigin: "center bottom" });
    const timeline = gsap.timeline();
    timeline.to(deck, { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: "power3.out" }, 0.2);
    timeline.to(cover, { rotationX: 8, duration: 2.5, ease: "power2.inOut" }, 1.35);
    timeline.to(cover, {
      rotationX: 0,
      duration: 0.9,
      ease: "power2.out",
      onComplete: () => finish.current(),
    });
  }, { dependencies: [reduce] });

  return { rig, lid };
}
