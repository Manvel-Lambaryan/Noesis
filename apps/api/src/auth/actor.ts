export type RoleName = "buyer" | "seller" | "admin";

export type PermissionName = "moderation" | "finance";

export type VerificationState =
  | "draft"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "suspended";

export type Actor = {
  userId: string;
  email: string;
  roles: RoleName[];
  permissions: PermissionName[];
  emailVerified: boolean;
};

export type GateReason =
  | "unauthenticated"
  | "email_unverified"
  | "seller_role_required"
  | "seller_not_verified"
  | "buyer_role_required";

export type Gate = { allowed: true } | { allowed: false; reason: GateReason };
