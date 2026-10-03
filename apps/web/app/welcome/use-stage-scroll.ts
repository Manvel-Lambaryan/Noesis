"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

const REDUCED = "(prefers-reduced-motion: reduce)";

export function useStageScroll(
  open: boolean,
  gone: boolean,
  scrollerRef: RefObject<HTMLDivElement | null>,
  stageRef: RefObject<HTMLDivElement | null>,
  homeRef: RefObject<HTMLElement | null>,
): void {
  useGSAP(() => {
    const root = scrollerRef.current;
    const stage = stageRef.current;
    const home = homeRef.current;
    const board = stage?.querySelector("article");
    const copy = home?.firstElementChild;
    if (!open || gone || root === null || home === null || stage === null) return;
    if (!(board instanceof HTMLElement) || !(copy instanceof HTMLElement)) return;
    if (window.matchMedia(REDUCED).matches) return;
    leaveBoard(board, stage, root);
    revealHome(home, copy, root);
  }, { dependencies: [open, gone], scope: scrollerRef, revertOnUpdate: true });
}

function leaveBoard(board: HTMLElement, stage: HTMLElement, root: HTMLElement): void {
  gsap.fromTo(board, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }, {
    opacity: 0,
    y: -56,
    scale: 0.96,
    filter: "blur(8px)",
    ease: "none",
    immediateRender: false,
    scrollTrigger: span(stage, root, "top top", "bottom top"),
  });
}

function revealHome(home: HTMLElement, copy: HTMLElement, root: HTMLElement): void {
  gsap.fromTo(home, { opacity: 0 }, {
    opacity: 1,
    ease: "none",
    scrollTrigger: span(home, root, "top bottom", "top top"),
  });
  gsap.fromTo(copy, { y: 42 }, {
    y: 0,
    ease: "none",
    immediateRender: false,
    scrollTrigger: span(home, root, "top bottom", "top top"),
  });
}

function span(trigger: HTMLElement, root: HTMLElement, start: string, end: string): ScrollTrigger.Vars {
  return { trigger, scroller: root, start, end, scrub: 0.45 };
}
