import type { FormEvent } from "react";
import { GOAL_COPY, type OnboardingRole } from "../../lib/onboarding";
import choices from "./choices.module.css";
import styles from "./welcome.module.css";

const SUPPORT: Record<OnboardingRole, string> = {
  developer: "Choose the kinds of products you want to find first. You can browse the rest of NOESIS at any time.",
  business: "Choose the business solutions you want to see first. You can browse the rest of NOESIS at any time.",
  creator: "Choose what you want to learn before you publish. This step does not open a seller account.",
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
        <h1 id="goals-heading">Your goals</h1>
        <p id="goals-support" className={styles.support}>{SUPPORT[role]}</p>
      </div>
      <form onSubmit={onSubmit}>
        <fieldset className={styles.group} aria-labelledby="goals-heading" aria-describedby="goals-support">
          <div className={choices.goals}>
            {GOAL_COPY[role].map((goal) => (
              <GoalCard key={goal.id} id={goal.id} label={goal.label} selected={goals.includes(goal.id)} onToggle={onToggle} />
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
  label,
  selected,
  onToggle,
}: {
  id: string;
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
      <span>{label}</span>
      <span className={choices.check} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2.5 6.2 4.8 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </label>
  );
}
