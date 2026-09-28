import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { Actor } from "./actor";
import { AuthFailure } from "./auth-failure";
import { IAM_ACCESS, type IamAccess } from "../modules/iam/iam.public-port";

export type RequestWithActor = Request & { actor: Actor };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(IAM_ACCESS) private readonly iam: IamAccess) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { actor?: Actor }>();
    request.actor = await this.iam.authenticate(request.header("x-session-id"));
    return true;
  }
}

export function actorFrom(request: Request & { actor?: Actor }): Actor {
  if (request.actor === undefined) {
    throw new AuthFailure(401, "unauthenticated", "Sign in required.");
  }
  return request.actor;
}
