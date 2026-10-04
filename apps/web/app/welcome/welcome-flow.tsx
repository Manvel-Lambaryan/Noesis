"use client";

import type { OnboardingRole, OnboardingState } from "../../lib/onboarding";
import { RoleStep } from "./role-step";
import { useOnboardingDraft, useOnboardingFinish } from "./use-onboarding";
import stage from "./stage.module.css";

export function WelcomeFlow({ initial, signedIn }: { initial: OnboardingState; signedIn: boolean }) {
  const draft = useOnboardingDraft(initial);
  const finish = useOnboardingFinish(draft.state);

  function confirm(role: OnboardingRole): void {
    const goals = draft.state.role === role ? draft.state.goals : [];
    finish.exitTo("/register", { ...draft.state, role, goals, step: 1 });
  }

  return (
    <div className={`${stage.journey} welcome-shell welcome-stage`}>
      <RoleStep
        role={draft.state.role}
        pending={finish.pending}
        signedIn={signedIn}
        saveError={draft.saveError}
        onSelect={draft.selectRole}
        onContinue={confirm}
        onSignIn={() => finish.exitTo("/login")}
      />
    </div>
  );
}
