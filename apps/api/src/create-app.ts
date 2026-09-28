import "reflect-metadata";
import { type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import { ApiExceptionFilter } from "./auth/api-exception.filter";
import { internalTokenAccepts } from "./auth/internal-token";
import { resolveCorrelationId } from "./logging/correlation-id";
import { AppModule } from "./app.module";

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.use(assignCorrelation);
  app.use(uploadCors);
  app.use(requireInternalToken);
  app.useGlobalFilters(new ApiExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle("NOESIS API")
    .setDescription("Slice 5 moderation and publication. Browser clients use the web BFF.")
    .setVersion("0.5.0")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  return app;
}

function assignCorrelation(request: Request, response: Response, next: NextFunction): void {
  const correlationId = resolveCorrelationId(request.header("x-correlation-id"));
  request.headers["x-correlation-id"] = correlationId;
  response.setHeader("x-correlation-id", correlationId);
  next();
}

function uploadCors(request: Request, response: Response, next: NextFunction): void {
  if (!request.path.startsWith("/uploads/quarantine/")) {
    next();
    return;
  }
  const allowed = process.env.APP_PUBLIC_URL ?? "http://localhost:3000";
  const origin = request.header("origin");
  if (origin !== undefined && origin !== allowed) {
    response.status(403).end();
    return;
  }
  if (origin === allowed) {
    response.setHeader("access-control-allow-origin", allowed);
    response.setHeader("access-control-allow-methods", "PUT, OPTIONS");
    response.setHeader("access-control-allow-headers", "content-type");
    response.setHeader("vary", "Origin");
  }
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  next();
}

function requireInternalToken(request: Request, response: Response, next: NextFunction): void {
  if (!request.path.startsWith("/v1/")) {
    next();
    return;
  }
  if (internalTokenAccepts(request.header("x-internal-token"))) {
    next();
    return;
  }
  const correlationId = resolveCorrelationId(request.header("x-correlation-id"));
  response.status(401).json({
    code: "unauthenticated",
    message: "Internal access only.",
    correlationId,
  });
}
