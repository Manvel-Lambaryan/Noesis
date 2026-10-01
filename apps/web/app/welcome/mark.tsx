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
