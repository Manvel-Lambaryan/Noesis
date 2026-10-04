"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ONBOARDING_ROLES, ROLE_COPY, WELCOME_QUESTION, type OnboardingRole, type OnboardingStep } from "../../lib/onboarding";
import { Chevron } from "./mark";
import { StageNotes } from "./stage-cards";
import { StageGhost, StageIntro, StagePortrait } from "./stage-intro";
import { ROLE_EYEBROW } from "./stage-role";
import { StageScene } from "./stage-scene";
import styles from "./stage.module.css";

type SelectRole = (role: OnboardingRole, step?: OnboardingStep) => void;
const EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE = {
  out: { opacity: 0, transition: { duration: 0.28, ease: EASE } },
  in: { opacity: 1, transition: { duration: 0.55, delay: 0.08, ease: EASE } },
};

export function RoleStep({
  role,
  pending,
  signedIn,
  saveError,
  onSelect,
  onContinue,
  onSignIn,
}: {
  role: OnboardingRole | null;
  pending: boolean;
  signedIn: boolean;
  saveError: string;
  onSelect: SelectRole;
  onContinue: (role: OnboardingRole) => void;
  onSignIn: () => void;
}) {
  const index = focusIndex(role);
  const item = ONBOARDING_ROLES[index] ?? "developer";
  const copy = ROLE_COPY[item];
  useRoleKeys(index, pending, onSelect);

  return (
    <div className={styles.frame}>
      <article className={styles.board} aria-labelledby="stage-title">
        <StageScene />
        <Brand />
        <MenuMark />
        <AnimatePresence>
          <StageSlide key={item} item={item} title={copy.title} body={copy.description} pending={pending} onContinue={onContinue} />
        </AnimatePresence>
        <NextRole index={index} pending={pending} onSelect={onSelect} />
        <Meter index={index} />
        <Corner signedIn={signedIn} pending={pending} onSignIn={onSignIn} />
        <RoleChoices role={role} onSelect={onSelect} />
      </article>
      {saveError.length > 0 ? <p className={styles.error} role="alert">{saveError}</p> : null}
    </div>
  );
}

function useRoleKeys(index: number, pending: boolean, onSelect: SelectRole): void {
  const select = useRef(onSelect);
  select.current = onSelect;
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (pending || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
      event.preventDefault();
      const count = ONBOARDING_ROLES.length;
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = ONBOARDING_ROLES[(index + delta + count) % count];
      if (next) select.current(next, 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, pending]);
}

function focusIndex(role: OnboardingRole | null): number {
  if (role === null) return 0;
  const index = ONBOARDING_ROLES.indexOf(role);
  return index < 0 ? 0 : index;
}

function titleLines(title: string): [string, string] {
  const space = title.indexOf(" ");
  if (space === -1) return [title, ""];
  return [title.slice(0, space), title.slice(space + 1)];
}

function StageSlide({
  item,
  title,
  body,
  pending,
  onContinue,
}: {
  item: OnboardingRole;
  title: string;
  body: string;
  pending: boolean;
  onContinue: (role: OnboardingRole) => void;
}) {
  const reduce = useReducedMotion();
  const lines = titleLines(title);
  return (
    <motion.div
      className={styles.slide}
      initial={reduce ? false : "out"}
      animate={reduce ? undefined : "in"}
      exit={reduce ? undefined : "out"}
      variants={SLIDE}
    >
      <StageIntro lines={lines} eyebrow={ROLE_EYEBROW[item]} body={body} />
      <StageGhost lines={lines} />
      <StagePortrait role={item} />
      <StageNotes role={item} title={title} body={body} pending={pending} onContinue={() => onContinue(item)} />
    </motion.div>
  );
}

function Brand() {
  return (
    <p className={styles.brand}>
      <span className={styles.dash} aria-hidden="true" />
      NOESIS
    </p>
  );
}

function MenuMark() {
  return (
    <span className={styles.menu} aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function NextRole({ index, pending, onSelect }: { index: number; pending: boolean; onSelect: SelectRole }) {
  function onClick(): void {
    const next = ONBOARDING_ROLES[(index + 1) % ONBOARDING_ROLES.length];
    if (next) onSelect(next, 1);
  }
  return (
    <button className={styles.next} type="button" aria-label="Next role" disabled={pending} onClick={onClick}>
      <Chevron />
    </button>
  );
}

function Meter({ index }: { index: number }) {
  return (
    <div className={styles.meter} aria-hidden="true">
      {ONBOARDING_ROLES.map((item, slot) => (
        <span key={item} data-active={slot === index ? "" : undefined} />
      ))}
    </div>
  );
}

function Corner({ signedIn, pending, onSignIn }: { signedIn: boolean; pending: boolean; onSignIn: () => void }) {
  if (signedIn) return <p className={styles.corner}>Signed in</p>;
  return (
    <button className={styles.corner} type="button" onClick={onSignIn} disabled={pending}>
      <span>Sign in</span>
      <span className={styles.nudge} aria-hidden="true">→</span>
    </button>
  );
}

function RoleChoices({ role, onSelect }: { role: OnboardingRole | null; onSelect: SelectRole }) {
  return (
    <div className={styles.srOnly} role="radiogroup" aria-label={WELCOME_QUESTION}>
      {ONBOARDING_ROLES.map((item) => (
        <label key={item}>
          <input type="radio" name="onboarding-role" value={item} checked={role === item} onChange={() => onSelect(item, 1)} />
          {ROLE_COPY[item].title}
        </label>
      ))}
    </div>
  );
}
