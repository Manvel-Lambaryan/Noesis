import type { Actor } from "../../auth/actor";

export type LoginResult = {
  sessionToken: string;
  expiresAt: string;
  actor: Actor;
};

export interface IamAccess {
  register(input: {
    email: unknown;
    password: unknown;
    confirmPassword: unknown;
    givenName: unknown;
    familyName: unknown;
    phone: unknown;
    dial: unknown;
    correlationId: string;
  }): Promise<{ userId: string }>;
  login(input: { email: unknown; password: unknown; ip: string; correlationId: string }): Promise<LoginResult>;
  logout(token: string | undefined): Promise<void>;
  authenticate(token: string | undefined): Promise<Actor>;
  verifyEmail(token: unknown): Promise<void>;
  requestEmailVerification(email: unknown, ip: string): Promise<void>;
  requestPasswordReset(email: unknown, ip: string): Promise<void>;
  confirmPasswordReset(token: unknown, password: unknown): Promise<void>;
  assignSellerRole(userId: string): Promise<void>;
  requireModeration(actor: Actor): void;
  requireFinance(actor: Actor): void;
}

export const IAM_ACCESS = Symbol("IAM_ACCESS");
