import type { PermissionName, RoleName } from "../../auth/actor";

export type TokenPurpose = "email_verification" | "password_reset";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  roles: RoleName[];
  permissions: PermissionName[];
};

export type NewToken = {
  id: string;
  userId: string;
  purpose: TokenPurpose;
  tokenHash: string;
  expiresAt: Date;
};

export type NewSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface IamRepository {
  createUser(input: { id: string; email: string; passwordHash: string }): Promise<void>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  assignRole(userId: string, role: RoleName): Promise<void>;
  insertSession(input: NewSession): Promise<void>;
  findSessionUser(tokenHash: string, now: Date): Promise<UserRecord | null>;
  revokeSession(tokenHash: string, at: Date): Promise<void>;
  insertToken(input: NewToken): Promise<void>;
  emailForActiveToken(tokenHash: string, purpose: TokenPurpose, now: Date): Promise<string | null>;
  consumeEmailVerification(tokenHash: string, now: Date): Promise<boolean>;
  consumePasswordReset(tokenHash: string, now: Date, passwordHash: string): Promise<boolean>;
}

export const IAM_REPOSITORY = Symbol("IAM_REPOSITORY");
