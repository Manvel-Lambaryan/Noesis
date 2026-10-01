import type { OnboardingRole } from "../../lib/onboarding";
import chrome from "./chrome.module.css";

export function Monogram() {
  return <img className={chrome.mark} src="/brand/noesis-mark.png" width={40} height={40} alt="" />;
}

export function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RoleArt({ role }: { role: OnboardingRole }) {
  if (role === "developer") {
    return <LaptopArt />;
  }
  if (role === "business") {
    return <BriefcaseArt />;
  }
  return <StorefrontArt />;
}

function LaptopArt() {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true">
      <defs>
        <linearGradient id="lap-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e0b5" />
          <stop offset="0.5" stopColor="#c9a35a" />
          <stop offset="1" stopColor="#8f6828" />
        </linearGradient>
        <linearGradient id="lap-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="1" stopColor="#f4ead6" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="122" rx="46" ry="8" fill="#e7d7b4" opacity="0.7" />
      <path d="M28 96h104l10 16H18z" fill="url(#lap-gold)" />
      <path d="M70 104h20v4H70z" fill="#fff6e4" opacity="0.8" />
      <rect x="38" y="28" width="84" height="64" rx="8" fill="url(#lap-gold)" />
      <rect x="44" y="34" width="72" height="50" rx="4" fill="url(#lap-screen)" />
      <path d="M68 46 61 58l7 12M92 46l7 12-7 12M76 66l8-20" fill="none" stroke="#a8833d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseArt() {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true">
      <defs>
        <linearGradient id="case-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e4bc" />
          <stop offset="0.48" stopColor="#d4b06a" />
          <stop offset="1" stopColor="#8d6424" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="122" rx="42" ry="8" fill="#e7d7b4" opacity="0.7" />
      <rect x="36" y="52" width="88" height="62" rx="12" fill="url(#case-gold)" />
      <path d="M36 74h88" stroke="#f8edd4" strokeWidth="3" opacity="0.55" />
      <rect x="68" y="68" width="24" height="14" rx="3" fill="#fff8ea" />
      <path d="M62 52v-8a18 18 0 0 1 36 0v8" fill="none" stroke="#a8833d" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function StorefrontArt() {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true">
      <defs>
        <linearGradient id="shop-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4e2b8" />
          <stop offset="1" stopColor="#b4893c" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="122" rx="44" ry="8" fill="#e7d7b4" opacity="0.7" />
      <path d="M34 58h92l-8 16H42z" fill="url(#shop-gold)" />
      <path d="M42 58c8 14 18 14 26 0 8 14 18 14 26 0 8 14 18 14 26 0" fill="none" stroke="#8d6424" strokeWidth="3" />
      <rect x="46" y="74" width="68" height="40" rx="4" fill="#fffaf2" stroke="#e6d3a4" />
      <rect x="72" y="86" width="16" height="28" rx="2" fill="#c9a35a" />
      <rect x="54" y="84" width="14" height="12" rx="2" fill="#f3e6c8" />
      <rect x="92" y="84" width="14" height="12" rx="2" fill="#f3e6c8" />
    </svg>
  );
}
