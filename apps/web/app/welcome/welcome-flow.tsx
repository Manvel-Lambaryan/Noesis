"use client";

import { useEffect, useRef } from "react";
import type { OnboardingState, OnboardingStep } from "../../lib/onboarding";
import { AccountLine } from "./account-line";
import chrome from "./chrome.module.css";
import { GoalsStep } from "./goals-step";
import { Hero } from "./hero";
import { Monogram } from "./mark";
import { Progress } from "./progress";
import { RoleStep } from "./role-step";
import { StartStep } from "./start-step";
import { useOnboardingDraft, useOnboardingFinish } from "./use-onboarding";
import { useStageReveal } from "./use-stage-reveal";
import styles from "./welcome.module.css";

export function WelcomeFlow({ initial, signedIn }: { initial: OnboardingState; signedIn: boolean }) {
  const draft = useOnboardingDraft(initial);
  const finish = useOnboardingFinish(draft.state);
  const shown: OnboardingStep = draft.state.role === null ? 1 : draft.state.step;
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useStageReveal(shellRef);
  useStepFocus(panelRef, shown);

  return (
    <div ref={shellRef} className={`${styles.shell} welcome-shell`}>
      <header className={chrome.header} data-reveal="header">
        <Brand />
        <Wordmark />
        <LanguageSelect />
      </header>
      <main className={styles.main}>
        <Hero />
        <section className={styles.panel} data-reveal="panel" aria-busy={finish.pending}>
          <Progress step={shown} onBack={draft.move} />
          <p className={styles.srOnly} aria-live="polite">{stepLive(shown)}</p>
          <div key={shown} ref={panelRef} tabIndex={-1} className={styles.stepBody}>
            <OnboardingStepView shown={shown} signedIn={signedIn} draft={draft} finish={finish} />
          </div>
          {draft.saveError.length > 0 ? <p className={styles.saveError} role="alert">{draft.saveError}</p> : null}
          {shown < 3 ? <AccountLine signedIn={signedIn} pending={finish.pending} onSignIn={() => finish.exitTo("/login")} /> : null}
        </section>
      </main>
    </div>
  );
}

function OnboardingStepView({
  shown,
  signedIn,
  draft,
  finish,
}: {
  shown: OnboardingStep;
  signedIn: boolean;
  draft: ReturnType<typeof useOnboardingDraft>;
  finish: ReturnType<typeof useOnboardingFinish>;
}) {
  if (shown === 1) {
    return <RoleStep role={draft.state.role} pending={finish.pending} onSelect={draft.selectRole} onContinue={() => draft.move(2)} />;
  }
  if (shown === 2 && draft.state.role !== null) {
    return (
      <GoalsStep
        role={draft.state.role}
        goals={draft.state.goals}
        pending={finish.pending}
        onToggle={draft.toggleGoal}
        onBack={() => draft.move(1)}
        onContinue={() => draft.move(3)}
      />
    );
  }
  return (
    <StartStep
      state={draft.state}
      signedIn={signedIn}
      pending={finish.pending}
      onBack={() => draft.move(2)}
      onExplore={finish.explore}
      onSecondary={finish.exitTo}
    />
  );
}

function useStepFocus(ref: { current: HTMLDivElement | null }, step: OnboardingStep): void {
  const previous = useRef(step);
  useEffect(() => {
    if (previous.current === step) {
      return;
    }
    previous.current = step;
    ref.current?.focus({ preventScroll: true });
  }, [ref, step]);
}

function stepLive(step: OnboardingStep): string {
  if (step === 1) {
    return "Step 1 of 3: Your role";
  }
  if (step === 2) {
    return "Step 2 of 3: Your goals";
  }
  return "Step 3 of 3: Get started";
}

function Wordmark() {
  return (
    <nav className={chrome.nav} aria-label="NOESIS">
      <span>Build</span>
      <span className={chrome.navRule} aria-hidden="true" />
      <span>Share</span>
      <span className={chrome.navRule} aria-hidden="true" />
      <span>Grow</span>
    </nav>
  );
}

function Brand() {
  return (
    <div className={chrome.brand}>
      <Monogram />
      <span>
        <span className={chrome.brandName}>NOESIS</span>
        <span className={chrome.brandTag}>The developer marketplace</span>
      </span>
    </div>
  );
}

function LanguageSelect() {
  return (
    <label className={chrome.language}>
      <Globe />
      <span aria-hidden="true">English</span>
      <select className={styles.srOnly} defaultValue="en" aria-label="Language">
        <option value="en">English</option>
      </select>
    </label>
  );
}

function Globe() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 9h14M9 2c2 2.2 2 11.8 0 14M9 2c-2 2.2-2 11.8 0 14" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
