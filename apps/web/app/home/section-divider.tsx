import styles from "./section-divider.module.css";

export function SectionDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <svg className={styles.wave} viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path
          fill="var(--surface-parchment)"
          d="M0 118C220 86 420 148 680 112C940 76 1120 142 1440 108V200H0Z"
        />
        <path
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          d="M0 118C220 86 420 148 680 112C940 76 1120 142 1440 108"
        />
        <path
          fill="none"
          stroke="var(--gold)"
          strokeWidth="0.7"
          opacity="0.45"
          vectorEffect="non-scaling-stroke"
          d="M0 128C240 98 440 156 700 122C960 88 1140 150 1440 118"
        />
      </svg>
      <Sprig className={styles.left} />
      <Sprig className={`${styles.right} ${styles.flip}`} />
      <svg className={styles.arc} viewBox="0 0 220 70">
        <path d="M16 62C48 18 172 18 204 62" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <path d="M46 62C70 34 150 34 174 62" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      </svg>
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
