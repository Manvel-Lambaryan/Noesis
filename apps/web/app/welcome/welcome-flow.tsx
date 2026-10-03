"use client";

import { useEffect, useRef, useState } from "react";
import type { OnboardingRole, OnboardingState } from "../../lib/onboarding";
import { Opening } from "./opening";
import { RoleStep } from "./role-step";
import { useOnboardingDraft, useOnboardingFinish } from "./use-onboarding";
import stage from "./stage.module.css";
import { useStageScroll } from "./use-stage-scroll";
import { WelcomeHome } from "./welcome-home";

export function WelcomeFlow({ initial, signedIn }: { initial: OnboardingState; signedIn: boolean }) {
  const draft = useOnboardingDraft(initial);
  const finish = useOnboardingFinish(draft.state);
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const snap = useStageExit(ready);
  useScrollLock(!ready, snap.scrollerRef);
  useStageScroll(ready, snap.gone, snap.scrollerRef, snap.stageRef, snap.homeRef);

  function confirm(role: OnboardingRole): void {
    draft.selectRole(role, 1);
    setReady(true);
  }

  return (
    <div
      ref={snap.scrollerRef}
      className={`${stage.journey} welcome-shell welcome-stage`}
      data-open={ready}
      data-home={snap.gone ? "" : undefined}
    >
      {entered ? null : <Opening onDone={() => setEntered(true)} />}
      {snap.gone ? null : (
        <RoleStep
          stageRef={snap.stageRef}
          role={draft.state.role}
          pending={finish.pending}
          signedIn={signedIn}
          saveError={draft.saveError}
          locked={!entered}
          ready={ready}
          onSelect={draft.selectRole}
          onContinue={confirm}
          onSignIn={() => finish.exitTo("/login")}
        />
      )}
      <WelcomeHome homeRef={snap.homeRef} />
    </div>
  );
}

function useStageExit(open: boolean) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = scrollerRef.current;
    const stage = stageRef.current;
    if (root === null || stage === null || !open || gone) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio <= 0.02) setGone(true);
    }, { root, threshold: [0, 0.02] });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [open, gone]);

  useEffect(() => {
    if (!gone || scrollerRef.current === null) return;
    scrollerRef.current.scrollTop = 0;
  }, [gone]);

  return { scrollerRef, stageRef, homeRef, gone };
}

function useScrollLock(locked: boolean, scrollerRef: { current: HTMLDivElement | null }): void {
  useEffect(() => {
    if (!locked) return;
    const root = scrollerRef.current;
    function block(event: Event): void {
      event.preventDefault();
    }
    function onKey(event: KeyboardEvent): void {
      const scrolling = event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "PageDown" || event.key === "PageUp" || event.key === " " || event.key === "Home" || event.key === "End";
      if (scrolling) event.preventDefault();
    }
    function hold(): void {
      if (root !== null && root !== undefined) root.scrollTop = 0;
    }
    root?.addEventListener("wheel", block, { passive: false });
    root?.addEventListener("touchmove", block, { passive: false });
    root?.addEventListener("scroll", hold);
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      root?.removeEventListener("wheel", block);
      root?.removeEventListener("touchmove", block);
      root?.removeEventListener("scroll", hold);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey);
    };
  }, [locked, scrollerRef]);
}
