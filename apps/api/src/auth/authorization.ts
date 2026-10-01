import { AuthFailure } from "./auth-failure";
import type { Actor, Gate, PermissionName, VerificationState } from "./actor";

export function sessionView(actor: Actor, verificationState: VerificationState | null) {
  return {
    userId: actor.userId,
    email: actor.email,
    roles: actor.roles,
    permissions: actor.permissions,
    emailVerified: actor.emailVerified,
    gates: {
      purchase: purchaseGate(actor),
      sellerPublish: sellerPublishGate(actor, verificationState),
    },
  };
}

export function purchaseGate(actor: Actor | null): Gate {
  if (actor === null) {
    return { allowed: false, reason: "unauthenticated" };
  }
  if (!actor.roles.includes("buyer")) {
    return { allowed: false, reason: "buyer_role_required" };
  }
  if (!actor.emailVerified) {
    return { allowed: false, reason: "email_unverified" };
  }
  return { allowed: true };
}

export function sellerPublishGate(
  actor: Actor | null,
  verificationState: VerificationState | null,
): Gate {
  if (actor === null) {
    return { allowed: false, reason: "unauthenticated" };
  }
  if (!actor.roles.includes("seller")) {
    return { allowed: false, reason: "seller_role_required" };
  }
  if (!actor.emailVerified) {
    return { allowed: false, reason: "email_unverified" };
  }
  if (verificationState !== "verification_approved") {
    return { allowed: false, reason: "seller_not_verified" };
  }
  return { allowed: true };
}

export function requirePermission(actor: Actor, permission: PermissionName): void {
  if (!actor.roles.includes("admin") || !actor.permissions.includes(permission)) {
    throw new AuthFailure(403, "forbidden", "You do not have access to this resource.");
  }
}
