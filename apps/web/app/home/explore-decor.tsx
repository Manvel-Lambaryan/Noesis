import styles from "./explore-decor.module.css";

export function ExploreDecor() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <Leaf className={styles.left} />
      <Leaf className={styles.right} />
    </div>
  );
}

function Leaf({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 160 220" fill="none">
      <path d="M80 8C118 48 138 96 124 156C112 198 92 214 80 216C68 214 48 198 36 156C22 96 42 48 80 8Z" fill="currentColor" />
      <path d="M80 208C82 150 78 90 80 24" stroke="#f3e9dc" strokeWidth="1.2" />
    </svg>
  );
}
