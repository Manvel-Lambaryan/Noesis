"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./explore-categories.module.css";

export function ExploreReveal({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return <div className={ready ? styles.shown : styles.pending}>{children}</div>;
}
