import { Prisma } from "@prisma/client";
import type { RoleName } from "../../auth/actor";
import { AuthFailure } from "../../auth/auth-failure";
import type { PrismaService } from "../prisma.service";
import type { IamRepository, NewSession, NewToken, TokenPurpose, UserRecord } from "../../modules/iam/iam.repository";

const userInclude = { roles: true, permissions: true } as const;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export class PrismaIamRepository implements IamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: {
    id: string;
    email: string;
    passwordHash: string;
    givenName: string;
    familyName: string;
    phone: string;
  }): Promise<void> {
    try {
      await this.prisma.user.create({
        data: {
          id: input.id,
          email: input.email,
          passwordHash: input.passwordHash,
          givenName: input.givenName,
          familyName: input.familyName,
          phone: input.phone,
          roles: { create: { role: "buyer" } },
        },
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const phoneTaken = uniqueTarget(error).includes("phone");
        const message = phoneTaken ? "An account with this phone number already exists." : "An account with this email already exists.";
        throw new AuthFailure(409, "conflict", message);
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { email }, include: userInclude });
    return row === null ? null : toUser(row);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    return row === null ? null : toUser(row);
  }

  async assignRole(userId: string, role: RoleName): Promise<void> {
    await this.prisma.roleAssignment.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role },
      update: {},
    });
  }

  async insertSession(input: NewSession): Promise<void> {
    await this.prisma.session.create({ data: input });
  }

  async findSessionUser(tokenHash: string, now: Date): Promise<UserRecord | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: { include: userInclude } },
    });
    if (session === null || session.revokedAt !== null || session.expiresAt <= now) {
      return null;
    }
    return toUser(session.user);
  }

  async revokeSession(tokenHash: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: at },
    });
  }

  async insertToken(input: NewToken): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.authToken.deleteMany({
        where: { userId: input.userId, purpose: input.purpose, consumedAt: null },
      });
      await tx.authToken.create({ data: input });
    });
  }

  async emailForActiveToken(tokenHash: string, purpose: TokenPurpose, now: Date): Promise<string | null> {
    const token = await this.prisma.authToken.findFirst({
      where: { tokenHash, purpose, consumedAt: null, expiresAt: { gt: now } },
      include: { user: true },
    });
    return token?.user.email ?? null;
  }

  async consumeEmailVerification(tokenHash: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const taken = await tx.authToken.updateMany({
        where: { tokenHash, purpose: "email_verification", consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (taken.count !== 1) {
        return false;
      }
      const token = await tx.authToken.findUnique({ where: { tokenHash } });
      if (token === null) {
        return false;
      }
      await tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: now } });
      return true;
    });
  }

  async consumePasswordReset(tokenHash: string, now: Date, passwordHash: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const taken = await tx.authToken.updateMany({
        where: { tokenHash, purpose: "password_reset", consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (taken.count !== 1) {
        return false;
      }
      const token = await tx.authToken.findUnique({ where: { tokenHash } });
      if (token === null) {
        return false;
      }
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.session.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return true;
    });
  }
}

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    emailVerified: row.emailVerifiedAt !== null,
    roles: row.roles.map((role) => role.role),
    permissions: row.permissions.map((permission) => permission.permission),
  };
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function uniqueTarget(error: unknown): string {
  if (typeof error !== "object" || error === null || !("meta" in error)) return "";
  const meta = error.meta;
  if (typeof meta !== "object" || meta === null || !("target" in meta)) return "";
  const target = meta.target;
  if (Array.isArray(target)) return target.join(",");
  return typeof target === "string" ? target : "";
}
