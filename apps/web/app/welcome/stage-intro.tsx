import type { OnboardingRole } from "../../lib/onboarding";
import { display } from "./display-font";
import { RoleArt } from "./role-stage";
import styles from "./stage.module.css";

const PORTRAITS: Partial<Record<OnboardingRole, string>> = {
  developer: "/brand/roles/developer-hero.png?v=clear",
  business: "/brand/roles/business-hero.png?v=clear",
  guest: "/brand/roles/guest-hero.png?v=clear",
};

export function StageIntro({ lines, eyebrow, body }: { lines: [string, string]; eyebrow: string; body: string }) {
  return (
    <div className={styles.copy}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="stage-title" className={`${styles.title} ${display.className}`} aria-live="polite">
        <span>{lines[0]}</span>
        {lines[1].length > 0 ? <span>{lines[1]}</span> : null}
      </h1>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.lead}>{body}</p>
    </div>
  );
}

export function StageGhost({ lines }: { lines: [string, string] }) {
  return (
    <p className={`${styles.ghost} ${display.className}`} aria-hidden="true">
      <span>{lines[0]}</span>
      {lines[1].length > 0 ? <span>{lines[1]}</span> : null}
    </p>
  );
}

export function StagePortrait({ role }: { role: OnboardingRole }) {
  const src = PORTRAITS[role];
  if (src === undefined) {
    return (
      <div className={styles.hero}>
        <div className={styles.object}><RoleArt role={role} spinning={false} /></div>
      </div>
    );
  }
  return (
    <div className={styles.hero}>
      <img className={styles.portrait} src={src} alt="" />
    </div>
  );
}
