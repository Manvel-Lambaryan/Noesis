import type { FormEvent, ReactNode } from "react";
import {
  GOAL_COPY,
  ROLE_COPY,
  destinationFor,
  destinationLabel,
  secondaryAction,
  type OnboardingExit,
  type OnboardingState,
} from "../../lib/onboarding";
import { display } from "./display-font";
import styles from "./welcome.module.css";
import choices from "./choices.module.css";

export function StartStep({
  state,
  signedIn,
  pending,
  onBack,
  onExplore,
  onSecondary,
}: {
  state: OnboardingState;
  signedIn: boolean;
  pending: boolean;
  onBack: () => void;
  onExplore: () => void;
  onSecondary: (href: OnboardingExit) => void;
}) {
  const role = state.role;
  if (role === null) {
    return null;
  }
  const secondary = secondaryAction(role, signedIn);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!pending) {
      onExplore();
    }
  }

  return (
    <>
      <div className={styles.intro}>
        <h1 className={display.className}>Get <span className={styles.goldWord}>started</span></h1>
        <p className={styles.support}>Your choices personalize the first page we open. They do not limit the marketplace.</p>
      </div>
      <form onSubmit={onSubmit}>
        <SelectionSummary state={state} />
        <StepActions
          pending={pending}
          secondary={secondary}
          onBack={onBack}
          onSecondary={onSecondary}
        />
      </form>
    </>
  );
}

function SelectionSummary({ state }: { state: OnboardingState }) {
  const role = state.role;
  if (role === null) {
    return null;
  }
  const chosen = GOAL_COPY[role].filter((goal) => state.goals.includes(goal.id));
  return (
    <div className={choices.summary}>
      <h2>Your <span className={styles.goldWord}>selection</span></h2>
      <dl className={choices.facts}>
        <Fact label="Role">{ROLE_COPY[role].title}</Fact>
        <Fact label="Interests">
          {chosen.length > 0 ? (
            <ul className={choices.picks}>
              {chosen.map((goal) => <li key={goal.id}>{goal.label}</li>)}
            </ul>
          ) : "No interests selected."}
        </Fact>
        <Fact label="First stop">{destinationLabel(destinationFor(state))}</Fact>
      </dl>
      <p className={choices.note}>{permissionNote(role)}</p>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={choices.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function StepActions({
  pending,
  secondary,
  onBack,
  onSecondary,
}: {
  pending: boolean;
  secondary: ReturnType<typeof secondaryAction>;
  onBack: () => void;
  onSecondary: (href: OnboardingExit) => void;
}) {
  return (
    <>
      <div className={styles.actions}>
        <button className={styles.back} type="button" onClick={onBack} disabled={pending}>Back</button>
        <button className={styles.primary} type="submit" disabled={pending}>Explore NOESIS</button>
      </div>
      {secondary !== null ? (
        <p className={styles.footer}>
          <button className={styles.quiet} type="button" disabled={pending} onClick={() => onSecondary(secondary.href)}>
            {secondary.label}
          </button>
        </p>
      ) : null}
    </>
  );
}

function permissionNote(role: OnboardingState["role"]): string {
  if (role === "creator") {
    return "Choosing Creator / Seller does not grant seller access. You can prepare a profile later, and you can still buy from the full catalog.";
  }
  if (role === "guest") {
    return "Choosing Guest does not create an account or change permissions. You can browse the full catalog and sign in whenever you want.";
  }
  return "This preference does not change account permissions. You can browse, buy, and later sell across the whole catalog.";
}
