"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ENTERED_COOKIE,
  JOINED_COOKIE,
  ONBOARDING_COOKIE,
  destinationFor,
  isOnboardingExit,
  onboardingCookieOptions,
  parseOnboardingInput,
  serializeOnboarding,
  type OnboardingState,
} from "../../lib/onboarding";

async function writeOnboarding(state: OnboardingState): Promise<void> {
  (await cookies()).set(ONBOARDING_COOKIE, serializeOnboarding(state), onboardingCookieOptions());
}

export async function saveOnboardingDraft(input: unknown): Promise<void> {
  const state = parseOnboardingInput(input);
  if (state === null) {
    return;
  }
  await writeOnboarding({ ...state, status: "draft" });
}

export async function finishOnboarding(input: unknown): Promise<void> {
  const state = parseOnboardingInput(input);
  if (state === null || state.role === null) {
    return;
  }
  const done: OnboardingState = { ...state, status: "complete", step: 3 };
  await writeOnboarding(done);
  redirect(destinationFor(done));
}

export async function finishIntro(): Promise<void> {
  const jar = await cookies();
  jar.set(ENTERED_COOKIE, "1", onboardingCookieOptions());
  jar.delete(JOINED_COOKIE);
  redirect("/");
}

export async function leaveOnboarding(input: unknown, href: unknown): Promise<void> {
  if (!isOnboardingExit(href)) {
    return;
  }
  const state = parseOnboardingInput(input);
  if (state !== null) {
    await writeOnboarding({ ...state, status: "draft" });
  }
  redirect(href);
}
