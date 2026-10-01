import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GOAL_COPY,
  ONBOARDING_COOKIE,
  ONBOARDING_ROLES,
  ROLE_COPY,
  WELCOME_QUESTION,
  WELCOME_SUPPORT,
  destinationFor,
  initialOnboardingState,
  isOnboardingExit,
  isOnboardingFinished,
  onboardingCookieOptions,
  onboardingRedirect,
  parseOnboarding,
  parseOnboardingInput,
  secondaryAction,
  serializeOnboarding,
} from "./onboarding.ts";

const developer = {
  ...initialOnboardingState(),
  status: "complete" as const,
  step: 3 as const,
  role: "developer" as const,
};

describe("onboarding marker", () => {
  it("round-trips a versioned draft", () => {
    const state = {
      ...initialOnboardingState(),
      step: 2 as const,
      role: "creator" as const,
      goals: ["selling", "publishing"],
    };
    assert.equal(parseOnboarding(serializeOnboarding(state)).status, "draft");
    assert.deepEqual(parseOnboarding(serializeOnboarding(state)), state);
    assert.equal(serializeOnboarding(state).startsWith("v1|"), true);
  });

  it("treats only complete and skipped markers as finished", () => {
    assert.equal(isOnboardingFinished(initialOnboardingState()), false);
    assert.equal(isOnboardingFinished(parseOnboarding("v1|complete|3|business|_")), true);
    assert.equal(isOnboardingFinished(parseOnboarding("v1|skipped|1|_|_")), true);
    assert.equal(isOnboardingFinished(parseOnboarding("v2|complete|3|developer|_")), false);
    assert.equal(isOnboardingFinished(parseOnboarding(undefined)), false);
  });

  it("drops unknown goals and ignores authorization fields", () => {
    const parsed = parseOnboarding("v1|draft|2|developer|crm,components,components");
    assert.deepEqual(parsed.goals, ["components"]);
    const input = parseOnboardingInput({
      status: "draft",
      step: 1,
      role: "creator",
      goals: ["selling", "javascript"],
      permissions: ["seller"],
      roles: ["seller"],
    });
    assert.deepEqual(input, {
      version: 1,
      status: "draft",
      step: 1,
      role: "creator",
      goals: ["selling"],
    });
  });

  it("rejects malformed input", () => {
    assert.equal(parseOnboardingInput(null), null);
    assert.equal(parseOnboardingInput({ status: "draft", step: 2, role: "developer", goals: "components" }), null);
    assert.equal(parseOnboarding("v1|complete|9|developer|_").status, "draft");
    assert.equal(ONBOARDING_COOKIE, "noesis_onboarding");
  });
});

describe("onboarding routing", () => {
  it("shows welcome until the visitor is registered", () => {
    assert.equal(onboardingRedirect("/", false), "/welcome");
    assert.equal(onboardingRedirect("/welcome", false), null);
    assert.equal(onboardingRedirect("/", true), null);
    assert.equal(onboardingRedirect("/welcome", true), "/");
  });

  it("personalizes the first marketplace stop without granting seller access", () => {
    assert.equal(destinationFor({ ...developer, goals: ["javascript", "applications"] }), "/marketplace/javascript");
    assert.equal(destinationFor({ ...developer, goals: ["applications"] }), "/marketplace/business-apps");
    assert.equal(destinationFor({ ...developer, goals: [] }), "/marketplace/javascript");
    assert.equal(destinationFor({ ...developer, role: "business", goals: ["crm"] }), "/marketplace/business-apps");
    assert.equal(destinationFor({ ...developer, role: "creator", goals: ["selling", "seller-profile"] }), "/marketplace");
    assert.equal(destinationFor(initialOnboardingState()), "/marketplace");
    assert.equal(secondaryAction("creator", true)?.href, "/account/seller");
    assert.equal(secondaryAction("creator", false)?.href, "/register");
    assert.equal(secondaryAction("developer", true), null);
    assert.equal(secondaryAction("business", false)?.href, "/login");
    for (const role of ONBOARDING_ROLES) {
      for (const signedIn of [true, false]) {
        const action = secondaryAction(role, signedIn);
        if (action !== null) {
          assert.equal(isOnboardingExit(action.href), true);
        }
      }
    }
    assert.equal(isOnboardingExit("/marketplace"), false);
    assert.equal(isOnboardingExit("/account/products"), false);
  });
});

describe("onboarding copy", () => {
  it("keeps the role and goal sentences from the welcome brief", () => {
    assert.equal(WELCOME_QUESTION, "What best describes you?");
    assert.match(WELCOME_SUPPORT, /personalize your experience/);
    assert.equal(ROLE_COPY.developer.description, "I want to buy ready-to-use code, components and templates to build faster.");
    assert.equal(ROLE_COPY.business.description, "I want to find complete business applications and solutions for my company.");
    assert.equal(ROLE_COPY.creator.description, "I want to publish and sell my own code, components or applications.");
    assert.equal(GOAL_COPY.developer.length, 4);
    assert.equal(GOAL_COPY.business.length, 4);
    assert.equal(GOAL_COPY.creator.length, 4);
    assert.equal(GOAL_COPY.creator[2]?.label, "Prepare to create a seller profile.");
  });

  it("stores a persistent httpOnly preference cookie", () => {
    const cookie = onboardingCookieOptions();
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.path, "/");
    assert.equal(cookie.maxAge, 60 * 60 * 24 * 400);
    assert.equal(cookie.secure, process.env.NODE_ENV === "production");
  });
});
