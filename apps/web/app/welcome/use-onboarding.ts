"use client";

import { useRef, useState, useTransition } from "react";
import type { OnboardingExit, OnboardingRole, OnboardingState, OnboardingStep } from "../../lib/onboarding";
import { finishOnboarding, leaveOnboarding, saveOnboardingDraft } from "./actions";

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

  function selectRole(role: OnboardingRole): void {
    const goals = state.role === role ? state.goals : [];
    persist({ ...state, role, goals, step: 1 });
  }

  function toggleGoal(goal: string): void {
    if (state.role === null) {
      return;
    }
    const goals = state.goals.includes(goal)
      ? state.goals.filter((item) => item !== goal)
      : [...state.goals, goal];
    persist({ ...state, goals });
  }

  function move(step: OnboardingStep): void {
    if (step > 1 && state.role === null) {
      return;
    }
    persist({ ...state, step });
  }

  return { state, saveError, selectRole, toggleGoal, move };
}

export function useOnboardingFinish(state: OnboardingState) {
  const [pending, startTransition] = useTransition();

  function explore(): void {
    if (state.role === null) {
      return;
    }
    startTransition(() => {
      void finishOnboarding({ ...state, status: "complete", step: 3 });
    });
  }

  function exitTo(href: OnboardingExit): void {
    startTransition(() => {
      void leaveOnboarding({ ...state, status: "draft" }, href);
    });
  }

  return { pending, explore, exitTo };
}
