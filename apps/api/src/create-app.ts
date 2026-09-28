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
  app.use(requireInternalToken);
  app.useGlobalFilters(new ApiExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle("NOESIS API")
    .setDescription("Slice 2 identity. Browser clients use the web BFF.")
    .setVersion("0.2.0")
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
