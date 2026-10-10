import styles from "./explore-decor.module.css";

export function ExploreDecor() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <Sprig className={styles.left} />
      <Sprig className={styles.right} />
    </div>
  );
}

function Sprig({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 180 280" fill="none">
      <path d="M92 268C90 190 74 128 92 18" stroke="currentColor" strokeWidth="1.2" />
      <path d="M92 214C48 192 24 156 36 122C70 144 90 178 92 214Z" fill="currentColor" />
      <path d="M92 168C140 146 168 112 158 78C122 100 98 134 92 168Z" fill="currentColor" />
      <path d="M92 122C46 100 22 66 34 34C68 56 90 88 92 122Z" fill="currentColor" />
      <path d="M92 78C136 58 162 28 148 6C116 24 98 50 92 78Z" fill="currentColor" />
    </svg>
  );
}
