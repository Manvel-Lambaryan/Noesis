import { Body, Controller, Get, Headers, HttpCode, Inject, Post, Res } from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { AuthFailure } from "../../auth/auth-failure";
import { bodyRecord } from "../../auth/body";
import { clientIp } from "../../auth/internal-token";
import { resolveCorrelationId } from "../../logging/correlation-id";
import { NOTIFICATIONS_PORT, type NotificationsPort } from "../notifications/notifications.public-port";
import { IAM_ACCESS, type IamAccess } from "./iam.public-port";

@ApiTags("auth")
@Controller("v1/auth")
export class IamController {
  constructor(
    @Inject(IAM_ACCESS) private readonly iam: IamAccess,
    @Inject(NOTIFICATIONS_PORT) private readonly mailer: NotificationsPort,
  ) {}

  @Post("register")
  @HttpCode(201)
  @ApiHeader({ name: "x-correlation-id", required: false })
  register(
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
  ): Promise<{ userId: string }> {
    const payload = bodyRecord(body);
    return this.iam.register({
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      givenName: payload.givenName,
      familyName: payload.familyName,
      phone: payload.phone,
      dial: payload.dial,
      correlationId: resolveCorrelationId(correlationId),
    });
  }

  @Post("login")
  @HttpCode(200)
  login(
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
    @Headers("x-client-ip") ip: string | undefined,
  ) {
    const payload = bodyRecord(body);
    return this.iam.login({
      email: payload.email,
      password: payload.password,
      ip: clientIp(ip),
      correlationId: resolveCorrelationId(correlationId),
    });
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Headers("x-session-id") token: string | undefined): Promise<void> {
    return this.iam.logout(token);
  }

  @Post("email-verifications")
  async emailVerification(
    @Body() body: unknown,
    @Headers("x-client-ip") ip: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const payload = bodyRecord(body);
    if (typeof payload.token === "string") {
      await this.iam.verifyEmail(payload.token);
      response.status(204);
      return;
    }
    await this.iam.requestEmailVerification(payload.email, clientIp(ip));
    response.status(202);
  }

  @Post("password-resets")
  async passwordReset(
    @Body() body: unknown,
    @Headers("x-client-ip") ip: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const payload = bodyRecord(body);
    if (typeof payload.token === "string") {
      await this.iam.confirmPasswordReset(payload.token, payload.password);
      response.status(204);
      return;
    }
    await this.iam.requestPasswordReset(payload.email, clientIp(ip));
    response.status(202);
  }

  @Get("mailbox")
  mailbox(): { messages: ReturnType<NotificationsPort["capturedAuthEmails"]> } {
    if (!this.mailer.captureEnabled()) {
      throw new AuthFailure(404, "not_found", "Mailbox is not available.");
    }
    return { messages: this.mailer.capturedAuthEmails() };
  }
}
