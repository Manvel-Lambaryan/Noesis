import type { FormEvent } from "react";
import { ONBOARDING_ROLES, ROLE_COPY, WELCOME_QUESTION, WELCOME_SUPPORT, type OnboardingRole } from "../../lib/onboarding";
import { Chevron } from "./mark";
import { RoleArt } from "./role-stage";
import choices from "./choices.module.css";
import styles from "./welcome.module.css";

export function RoleStep({
  role,
  pending,
  onSelect,
  onContinue,
}: {
  role: OnboardingRole | null;
  pending: boolean;
  onSelect: (role: OnboardingRole) => void;
  onContinue: () => void;
}) {
  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (role !== null && !pending) {
      onContinue();
    }
  }

  return (
    <>
      <div className={styles.intro}>
        <h1>Welcome to <span className={styles.goldWord}>NOESIS</span></h1>
        <h2 id="role-heading" className={styles.question}>{WELCOME_QUESTION}</h2>
        <p id="role-support" className={styles.support}>{WELCOME_SUPPORT}</p>
      </div>
      <form onSubmit={onSubmit}>
        <fieldset className={styles.group} aria-labelledby="role-heading" aria-describedby="role-support">
          <div className={choices.cards}>
            {ONBOARDING_ROLES.map((item) => (
              <RoleCard key={item} item={item} selected={role === item} onSelect={onSelect} />
            ))}
          </div>
        </fieldset>
        <div className={styles.actions} data-ready={role !== null}>
          <button className={styles.primary} type="submit" disabled={role === null || pending}>Continue</button>
        </div>
      </form>
    </>
  );
}

function RoleCard({
  item,
  selected,
  onSelect,
}: {
  item: OnboardingRole;
  selected: boolean;
  onSelect: (role: OnboardingRole) => void;
}) {
  const copy = ROLE_COPY[item];
  return (
    <label className={choices.card} data-selected={selected}>
      <input
        className={styles.srOnly}
        type="radio"
        name="onboarding-role"
        value={item}
        checked={selected}
        onChange={() => onSelect(item)}
      />
      <span className={choices.art}><RoleArt role={item} spinning={selected} /></span>
      <span className={choices.copy}>
        <span className={choices.cardTitle}>{copy.title}</span>
        <span className={choices.cardText}>{copy.description}</span>
      </span>
      <span className={choices.arrow} aria-hidden="true"><Chevron /></span>
    </label>
  );
}
