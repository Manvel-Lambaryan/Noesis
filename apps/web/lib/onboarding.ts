export const ONBOARDING_COOKIE = "noesis_onboarding";
export const ONBOARDING_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
const MAX_COOKIE_LENGTH = 240;

export const ONBOARDING_ROLES = ["developer", "business", "creator", "guest"] as const;
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];
export type OnboardingStatus = "draft" | "complete" | "skipped";
export type OnboardingStep = 1 | 2 | 3;

export const ONBOARDING_EXITS = ["/login", "/register", "/account/seller"] as const;
export type OnboardingExit = (typeof ONBOARDING_EXITS)[number];

export const WELCOME_QUESTION = "What best describes you?";
export const WELCOME_SUPPORT =
  "This helps us personalize your experience and show you the most relevant content.";

export const ROLE_COPY: Record<OnboardingRole, { title: string; description: string }> = {
  developer: {
    title: "Developer",
    description: "I want to buy ready-to-use code, components and templates to build faster.",
  },
  business: {
    title: "Business Professional",
    description: "I want to find complete business applications and solutions for my company.",
  },
  creator: {
    title: "Creator / Seller",
    description: "I want to publish and sell my own code, components or applications.",
  },
  guest: {
    title: "Guest",
    description: "I want to look around the marketplace before I decide.",
  },
};

export const GOAL_COPY: Record<OnboardingRole, readonly { id: string; label: string }[]> = {
  developer: [
    { id: "components", label: "Explore reusable components." },
    { id: "templates", label: "Discover website templates." },
    { id: "javascript", label: "Find JavaScript / TypeScript products." },
    { id: "applications", label: "Browse complete applications." },
  ],
  business: [
    { id: "launch", label: "Find ready-to-launch applications." },
    { id: "crm", label: "Explore CRM and business solutions." },
    { id: "ecommerce", label: "Discover e-commerce solutions." },
    { id: "software", label: "Browse business software." },
  ],
  creator: [
    { id: "selling", label: "Explore selling opportunities." },
    { id: "publishing", label: "Learn about publishing products." },
    { id: "seller-profile", label: "Prepare to create a seller profile." },
    { id: "creator-market", label: "Discover the creator marketplace." },
  ],
  guest: [
    { id: "catalog", label: "Browse the full catalog." },
    { id: "categories", label: "Explore categories." },
    { id: "new", label: "See what's new." },
    { id: "decide", label: "Look around before I choose a role." },
  ],
};

export type OnboardingState = {
  version: typeof ONBOARDING_VERSION;
  status: OnboardingStatus;
  step: OnboardingStep;
  role: OnboardingRole | null;
  goals: string[];
};

export type SecondaryAction = { href: OnboardingExit; label: string };

export function initialOnboardingState(): OnboardingState {
  return { version: ONBOARDING_VERSION, status: "draft", step: 1, role: null, goals: [] };
}

export function isOnboardingFinished(state: OnboardingState): boolean {
  return state.status === "complete" || state.status === "skipped";
}

export function onboardingRedirect(pathname: "/" | "/welcome", registered: boolean): "/" | "/welcome" | null {
  if (registered) {
    return pathname === "/welcome" ? "/" : null;
  }
  return pathname === "/" ? "/welcome" : null;
}

export function serializeOnboarding(state: OnboardingState): string {
  const role = state.role ?? "_";
  const goals = state.goals.length === 0 ? "_" : state.goals.join(",");
  return `v${ONBOARDING_VERSION}|${state.status}|${state.step}|${role}|${goals}`;
}

export function parseOnboarding(value: string | undefined): OnboardingState {
  const empty = initialOnboardingState();
  if (value === undefined || value.length === 0 || value.length > MAX_COOKIE_LENGTH) {
    return empty;
  }
  const parts = value.split("|");
  if (parts.length !== 5 || parts[0] !== `v${ONBOARDING_VERSION}`) {
    return empty;
  }
  const status = parts[1];
  const step = Number(parts[2]);
  const role = parts[3] === "_" ? null : parts[3];
  if (!isStatus(status) || !isStep(step) || !isRole(role)) {
    return empty;
  }
  return {
    version: ONBOARDING_VERSION,
    status,
    step: role === null ? 1 : step,
    role,
    goals: sanitizeGoals(role, parts[4] === "_" ? [] : parts[4].split(",")),
  };
}

export function parseOnboardingInput(input: unknown): OnboardingState | null {
  if (!isRecord(input) || !isStatus(input.status) || !isStep(input.step) || !isRole(input.role)) {
    return null;
  }
  if (!Array.isArray(input.goals) || input.goals.some((goal) => typeof goal !== "string")) {
    return null;
  }
  const role = input.role;
  return {
    version: ONBOARDING_VERSION,
    status: input.status,
    step: role === null ? 1 : input.step,
    role,
    goals: sanitizeGoals(role, input.goals),
  };
}

export function destinationFor(state: OnboardingState): string {
  if (state.role === "business") {
    return "/marketplace/business-apps";
  }
  if (state.role === "developer") {
    const onlyApps = state.goals.length > 0 && state.goals.every((goal) => goal === "applications");
    return onlyApps ? "/marketplace/business-apps" : "/marketplace/javascript";
  }
  return "/marketplace";
}

export function destinationLabel(href: string): string {
  if (href === "/marketplace/javascript") {
    return "JavaScript and TypeScript";
  }
  if (href === "/marketplace/business-apps") {
    return "Business applications";
  }
  return "Marketplace";
}

export function secondaryAction(role: OnboardingRole, signedIn: boolean): SecondaryAction | null {
  if (role === "creator") {
    return signedIn
      ? { href: "/account/seller", label: "Prepare a seller profile" }
      : { href: "/register", label: "Create an account" };
  }
  return signedIn ? null : { href: "/login", label: "Sign in" };
}

export function isOnboardingExit(value: unknown): value is OnboardingExit {
  return typeof value === "string" && (ONBOARDING_EXITS as readonly string[]).includes(value);
}

export function onboardingCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

function sanitizeGoals(role: OnboardingRole | null, goals: string[]): string[] {
  if (role === null) {
    return [];
  }
  const allowed = new Set(GOAL_COPY[role].map((goal) => goal.id));
  const unique: string[] = [];
  for (const goal of goals) {
    if (allowed.has(goal) && !unique.includes(goal)) {
      unique.push(goal);
    }
  }
  return unique.slice(0, 4);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatus(value: unknown): value is OnboardingStatus {
  return value === "draft" || value === "complete" || value === "skipped";
}

function isStep(value: unknown): value is OnboardingStep {
  return value === 1 || value === 2 || value === 3;
}

function isRole(value: unknown): value is OnboardingRole | null {
  return value === null || (typeof value === "string" && (ONBOARDING_ROLES as readonly string[]).includes(value));
}
