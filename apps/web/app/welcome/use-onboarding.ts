"use client";

import { useRef, useState, useTransition } from "react";
import type { OnboardingExit, OnboardingRole, OnboardingState, OnboardingStep } from "../../lib/onboarding";
import { leaveOnboarding, saveOnboardingDraft } from "./actions";

export function useOnboardingDraft(initial: OnboardingState) {
  const [state, setState] = useState(initial);
  const [saveError, setSaveError] = useState("");
  const latest = useRef(initial);
  const queue = useRef(Promise.resolve());

  function persist(next: OnboardingState): void {
    latest.current = next;
    setState(next);
    setSaveError("");
    queue.current = queue.current
      .catch(() => undefined)
      .then(() => saveOnboardingDraft(next))
      .catch(() => {
        if (latest.current === next) {
          setSaveError("This step could not be saved yet. You can continue and try again.");
        }
      });
  }

  function selectRole(role: OnboardingRole, step: OnboardingStep = 1): void {
    const current = latest.current;
    const goals = current.role === role ? current.goals : [];
    persist({ ...current, role, goals, step });
  }

  return { state, saveError, selectRole };
}

export function useOnboardingFinish(state: OnboardingState) {
  const [pending, startTransition] = useTransition();

  function exitTo(href: OnboardingExit, next: OnboardingState = state): void {
    startTransition(() => {
      void leaveOnboarding({ ...next, status: "draft" }, href);
    });
  }

  return { pending, exitTo };
}
