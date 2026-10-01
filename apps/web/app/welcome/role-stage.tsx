"use client";

import { useEffect, useRef } from "react";
import type { OnboardingRole } from "../../lib/onboarding";
import choices from "./choices.module.css";

export function RoleArt({ role, spinning }: { role: OnboardingRole; spinning: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const spin = useRef(spinning);
  spin.current = spinning;

  useEffect(() => {
    const node = host.current;
    if (node === null) return;
    let stop: () => void = () => undefined;
    let cancel = false;
    void import("./role-view").then((mod) => {
      if (cancel || host.current === null) return;
      stop = mod.mountRole(host.current, role, spin);
    });
    return () => {
      cancel = true;
      stop();
    };
  }, [role]);

  return <div ref={host} className={choices.stage} aria-hidden="true" />;
}
