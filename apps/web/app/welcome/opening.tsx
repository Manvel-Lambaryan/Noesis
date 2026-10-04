"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./opening.module.css";

const SOURCE = "/brand/welcome-opening.mp4";
const POSTER = "/brand/welcome-opening.jpg";
const FADE_MS = 480;

export function Opening({ onDone }: { onDone: () => void }) {
  const finish = useRef(onDone);
  finish.current = onDone;
  const settled = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => finish.current(), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  function complete(): void {
    if (settled.current) return;
    settled.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish.current();
      return;
    }
    setLeaving(true);
  }

  const scene = leaving ? `${styles.scene} ${styles.leaving}` : styles.scene;
  return (
    <div className={scene}>
      <Film onEnded={complete} />
      <button className={styles.skip} type="button" onClick={complete}>
        Skip
      </button>
    </div>
  );
}

function Film({ onEnded }: { onEnded: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const ended = useRef(onEnded);
  ended.current = onEnded;

  useEffect(() => {
    const node = video.current;
    if (node === null) return;
    const handle = (): void => ended.current();
    node.addEventListener("ended", handle);
    node.addEventListener("error", handle);
    void node.play().catch(() => undefined);
    return () => {
      node.removeEventListener("ended", handle);
      node.removeEventListener("error", handle);
    };
  }, []);

  return (
    <video
      ref={video}
      className={styles.film}
      src={SOURCE}
      poster={POSTER}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-label="Welcome to NOESIS"
    />
  );
}
