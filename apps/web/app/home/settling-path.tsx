"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SettlingPathProps = {
  from: string;
  to: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};

export function SettlingPath({ from, to, fill = "none", stroke, strokeWidth, opacity }: SettlingPathProps) {
  const path = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const node = path.current;
    if (node === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.setAttribute("d", to);
      return;
    }
    const state = { amount: 0 };
    const context = gsap.context(() => {
      gsap.to(state, {
        amount: 1,
        duration: 2.1,
        ease: "power3.out",
        onUpdate: () => node.setAttribute("d", mixPath(from, to, state.amount)),
        scrollTrigger: {
          trigger: node.closest("svg") ?? node,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    });
    return () => context.revert();
  }, [from, to]);

  return (
    <path ref={path} d={from} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} vectorEffect={stroke ? "non-scaling-stroke" : undefined} />
  );
}

function mixPath(from: string, to: string, amount: number): string {
  const origin = from.match(/-?\d*\.?\d+/g);
  const target = to.match(/-?\d*\.?\d+/g);
  if (origin === null || target === null || origin.length !== target.length) return amount > 0.98 ? to : from;
  let index = 0;
  return from.replace(/-?\d*\.?\d+/g, () => {
    const value = Number(origin[index]) + (Number(target[index]) - Number(origin[index])) * amount;
    index += 1;
    return value.toFixed(1);
  });
}
