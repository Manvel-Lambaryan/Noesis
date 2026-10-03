import type { FormEvent } from "react";
import { GOAL_COPY, type OnboardingRole } from "../../lib/onboarding";
import { display } from "./display-font";
import choices from "./choices.module.css";
import styles from "./welcome.module.css";

const SUPPORT: Record<OnboardingRole, string> = {
  developer: "Choose the kinds of products you want to find first. You can browse the rest of NOESIS at any time.",
  business: "Choose the business solutions you want to see first. You can browse the rest of NOESIS at any time.",
  creator: "Choose what you want to learn before you publish. This step does not open a seller account.",
  guest: "Choose what you want to see first. Looking around does not create an account.",
};

export function GoalsStep({
  role,
  goals,
  pending,
  onToggle,
  onBack,
  onContinue,
}: {
  role: OnboardingRole;
  goals: string[];
  pending: boolean;
  onToggle: (goal: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!pending) {
      onContinue();
    }
  }

  return (
    <>
      <div className={styles.intro}>
        <h1 id="goals-heading" className={display.className}>Your <span className={styles.goldWord}>goals</span></h1>
        <p id="goals-support" className={styles.support}>{SUPPORT[role]}</p>
      </div>
      <form onSubmit={onSubmit}>
        <fieldset className={styles.group} aria-labelledby="goals-heading" aria-describedby="goals-support">
          <div className={choices.goals}>
            {GOAL_COPY[role].map((goal, index) => (
              <GoalCard
                key={goal.id}
                id={goal.id}
                index={index + 1}
                label={goal.label}
                selected={goals.includes(goal.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </fieldset>
        <div className={styles.actions}>
          <button className={styles.back} type="button" onClick={onBack} disabled={pending}>Back</button>
          <button className={styles.primary} type="submit" disabled={pending}>Continue</button>
        </div>
      </form>
    </>
  );
}

function GoalCard({
  id,
  index,
  label,
  selected,
  onToggle,
}: {
  id: string;
  index: number;
  label: string;
  selected: boolean;
  onToggle: (goal: string) => void;
}) {
  return (
    <label className={choices.goal} data-selected={selected}>
      <input
        className={styles.srOnly}
        type="checkbox"
        name="onboarding-goals"
        value={id}
        checked={selected}
        onChange={() => onToggle(id)}
      />
      <span className={choices.goalMark} aria-hidden="true">{String(index).padStart(2, "0")}</span>
      <span className={choices.goalLabel}>{label}</span>
      <span className={choices.check} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 12 12">
          <path d="M2.2 6.2 4.7 8.7 9.8 3.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}
