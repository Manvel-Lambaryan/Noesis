"use client";

import { Play } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./presentation-rail.module.css";

const STEPS = [
  { n: "01", title: "Discover", body: "Explore thousands of projects, templates and tools." },
  { n: "02", title: "Build", body: "Use, customize and launch faster with real code." },
  { n: "03", title: "Grow", body: "Turn your ideas into products and reach a global audience." },
] as const;

const SOCIAL = [
  { label: "Facebook", d: "M14 8h-2a1 1 0 0 0-1 1v2H9v2.2h2V20h2.4v-6.8h1.8L16 11h-2.6V9.6c0-.3.2-.5.5-.5H16V8z" },
  { label: "LinkedIn", d: "M7 10.2H5V19h2V10.2zM6 6.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM19 19h-2v-4.3c0-1.2-.4-2-1.5-2-.8 0-1.3.6-1.5 1.1-.1.2-.1.5-.1.8V19h-2v-8.8h1.9v1.2c.4-.6 1.2-1.5 2.6-1.5 1.9 0 3.1 1.2 3.1 3.9V19z" },
  { label: "Instagram", d: "M9 6.5h6A2.5 2.5 0 0 1 17.5 9v6a2.5 2.5 0 0 1-2.5 2.5H9A2.5 2.5 0 0 1 6.5 15V9A2.5 2.5 0 0 1 9 6.5zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM16.2 8.1h.01" },
  { label: "X", d: "M7 7.2h1.8l2.4 3.3 2.6-3.3H17l-3.6 4.5 3.8 5.1h-1.8l-2.6-3.5-3 3.5H7l3.8-4.6L7 7.2z" },
] as const;

export function PresentationRail() {
  return (
    <section className={styles.rail} aria-label="How NOESIS works">
      <TrailerButton className={styles.play}>
        <span className={styles.playIcon} aria-hidden="true"><Play size={18} strokeWidth={0} fill="currentColor" /></span>
        <span>
          <strong>Play trailer</strong>
          <em>See NOESIS in 60 seconds</em>
        </span>
      </TrailerButton>
      <ol className={styles.steps}>
        {STEPS.map((step) => <ExperienceStep key={step.n} {...step} />)}
      </ol>
      <ul className={styles.social} aria-hidden="true">
        {SOCIAL.map((item) => (
          <li key={item.label}>
            <span className={styles.socialLink}>
              <svg viewBox="0 0 24 24"><path d={item.d} fill="currentColor" /></svg>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExperienceStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li>
      <span className={styles.mark}>
        <span className={styles.num}>{n}</span>
        <span className={styles.dot} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </li>
  );
}

export function TrailerButton({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)}>{children}</button>
      {open ? (
        <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className={styles.dialogCard}>
            <div className={styles.dialogHead}>
              <h2 id={titleId}>NOESIS trailer</h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)}>Close</button>
            </div>
            <video className={styles.video} src="/brand/welcome-opening.mp4" controls autoPlay playsInline />
          </div>
        </div>
      ) : null}
    </>
  );
}
