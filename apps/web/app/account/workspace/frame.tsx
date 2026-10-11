"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { display, text } from "../../fonts";
import type { NavCounts } from "../../../lib/workspace-nav";
import { WorkspaceSidebar } from "./sidebar";
import styles from "./shell.module.css";

export function WorkspaceFrame({ name, email, verified, status, counts, children }: {
  name: string;
  email: string;
  verified: boolean;
  status: string;
  counts: NavCounts | null;
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const shell = `${styles.shell} ${open ? styles.navOpen : ""} seller-workspace ${text.className} ${display.variable}`;
  return (
    <div className={shell}>
      <button className={styles.menuButton} type="button" aria-label="Open workspace menu" onClick={() => setOpen((value) => !value)}>
        <Menu strokeWidth={1.75} aria-hidden="true" />
        <span>Menu</span>
      </button>
      <div className={styles.body}>
        <div className={styles.rail}>
          <Suspense fallback={null}>
            <WorkspaceSidebar
              name={name}
              email={email}
              verified={verified}
              status={status}
              counts={counts}
              onClose={open ? () => setOpen(false) : undefined}
            />
          </Suspense>
        </div>
        {open ? <button className={styles.backdrop} type="button" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
