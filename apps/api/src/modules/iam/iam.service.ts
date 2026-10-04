import { Inject, Injectable } from "@nestjs/common";
import type { Logger } from "@noesis/kernel";
import { AuthFailure } from "../../auth/auth-failure";
import { API_LOGGER } from "../../health/health.controller";
import type { Actor } from "../../auth/actor";
import { dummyPasswordHash, hashPassword, verifyPassword } from "../../infrastructure/identity/password-hasher";
import { appPublicUrl, hashToken, randomToken, sessionExpiry } from "../../infrastructure/identity/token-hash";
import { AuthRateLimit } from "../../infrastructure/identity/auth-rate-limit";
import { NOTIFICATIONS_PORT, type NotificationsPort } from "../notifications/notifications.public-port";
import { requirePermission } from "../../auth/authorization";
import type { IamAccess, LoginResult } from "./iam.public-port";
import { IAM_REPOSITORY, type IamRepository, type TokenPurpose, type UserRecord } from "./iam.repository";
import { assertConfirmed, parseEmail, parsePassword, parsePersonName, parsePhone } from "../../auth/password-policy";

const INVALID_LINK = "This link is invalid or has already been used.";

@Injectable()
export class IamService implements IamAccess {
  constructor(
    @Inject(IAM_REPOSITORY) private readonly users: IamRepository,
    private readonly limits: AuthRateLimit,
    @Inject(NOTIFICATIONS_PORT) private readonly mailer: NotificationsPort,
    @Inject(API_LOGGER) private readonly logger: Logger,
  ) {}

  async register(input: {
    email: unknown;
    password: unknown;
    confirmPassword: unknown;
    givenName: unknown;
    familyName: unknown;
    phone: unknown;
    dial: unknown;
    correlationId: string;
  }): Promise<{ userId: string }> {
    const email = parseEmail(input.email);
    const password = parsePassword(input.password, email);
    assertConfirmed(password, input.confirmPassword);
    const givenName = parsePersonName(input.givenName, "first");
    const familyName = parsePersonName(input.familyName, "last");
    const phone = parsePhone(input.phone, input.dial);
    const userId = crypto.randomUUID();
    await this.users.createUser({
      id: userId,
      email,
      passwordHash: await hashPassword(password),
      givenName,
      familyName,
      phone,
    });
    await this.issue(userId, email, "email_verification");
    this.logger.info({ message: "register", correlationId: input.correlationId, status: "ok" });
    return { userId };
  }

  async login(input: { email: unknown; password: unknown; ip: string; correlationId: string }): Promise<LoginResult> {
    const email = parseEmail(input.email);
    const password = typeof input.password === "string" ? input.password : "";
    await this.limits.assertLoginAllowed(email, input.ip);
    const user = await this.users.findUserByEmail(email);
    const matches = await verifyPassword(user?.passwordHash ?? (await dummyPasswordHash()), password);
    if (user === null || !matches) {
      await this.limits.recordLoginFailure(email, input.ip);
      this.logger.info({ message: "login", correlationId: input.correlationId, status: "denied" });
      throw new AuthFailure(401, "unauthenticated", "Invalid email or password.");
    }
    const opened = await this.openSession(user.id);
    this.logger.info({ message: "login", correlationId: input.correlationId, status: "ok" });
    return { sessionToken: opened.token, expiresAt: opened.expiresAt.toISOString(), actor: toActor(user) };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token === undefined || token.length === 0) {
      return;
    }
    await this.users.revokeSession(hashToken(token), new Date());
  }

  async authenticate(token: string | undefined): Promise<Actor> {
    if (token === undefined || token.length === 0) {
      throw new AuthFailure(401, "unauthenticated", "Sign in required.");
    }
    const user = await this.users.findSessionUser(hashToken(token), new Date());
    if (user === null) {
      throw new AuthFailure(401, "unauthenticated", "Sign in required.");
    }
    return toActor(user);
  }

  async verifyEmail(token: unknown): Promise<void> {
    const ok = await this.users.consumeEmailVerification(hashToken(parseToken(token)), new Date());
    if (!ok) {
      throw new AuthFailure(400, "validation_failed", INVALID_LINK);
    }
  }

  async requestEmailVerification(email: unknown, ip: string): Promise<void> {
    const normalized = parseEmail(email);
    await this.limits.assertVerificationAllowed(normalized, ip);
    const user = await this.users.findUserByEmail(normalized);
    if (user === null || user.emailVerified) {
      return;
    }
    await this.issue(user.id, user.email, "email_verification");
  }

  async requestPasswordReset(email: unknown, ip: string): Promise<void> {
    const normalized = parseEmail(email);
    await this.limits.assertResetAllowed(normalized, ip);
    const user = await this.users.findUserByEmail(normalized);
    if (user === null) {
      return;
    }
    await this.issue(user.id, user.email, "password_reset");
  }

  async confirmPasswordReset(token: unknown, password: unknown): Promise<void> {
    const tokenHash = hashToken(parseToken(token));
    const now = new Date();
    const email = await this.users.emailForActiveToken(tokenHash, "password_reset", now);
    if (email === null) {
      throw new AuthFailure(400, "validation_failed", INVALID_LINK);
    }
    const nextHash = await hashPassword(parsePassword(password, email));
    const ok = await this.users.consumePasswordReset(tokenHash, now, nextHash);
    if (!ok) {
      throw new AuthFailure(400, "validation_failed", INVALID_LINK);
    }
  }

  async assignSellerRole(userId: string): Promise<void> {
    await this.users.assignRole(userId, "seller");
  }

  requireModeration(actor: Actor): void {
    requirePermission(actor, "moderation");
  }

  requireFinance(actor: Actor): void {
    requirePermission(actor, "finance");
  }

  private async openSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomToken();
    const expiresAt = sessionExpiry(new Date());
    await this.users.insertSession({ id: crypto.randomUUID(), userId, tokenHash: hashToken(token), expiresAt });
    return { token, expiresAt };
  }

  private async issue(userId: string, email: string, purpose: TokenPurpose): Promise<void> {
    const token = randomToken();
    const ttl = purpose === "email_verification" ? 86_400_000 : 3_600_000;
    await this.users.insertToken({
      id: crypto.randomUUID(),
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttl),
    });
    const path = purpose === "email_verification" ? "/verify-email" : "/reset-password";
    await this.mailer.sendAuthEmail({
      to: email,
      purpose,
      url: `${appPublicUrl()}${path}?token=${encodeURIComponent(token)}`,
    });
  }
}

function toActor(user: UserRecord): Actor {
  return {
    userId: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    emailVerified: user.emailVerified,
  };
}

function parseToken(value: unknown): string {
  if (typeof value !== "string" || value.length < 20 || value.length > 200) {
    throw new AuthFailure(400, "validation_failed", INVALID_LINK);
  }
  return value;
}
