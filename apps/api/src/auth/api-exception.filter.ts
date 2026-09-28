import { Catch, type ExceptionFilter, type ArgumentsHost, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";
import { resolveCorrelationId } from "../logging/correlation-id";
import { AuthFailure } from "./auth-failure";

type ErrorBody = { code: string; message: string };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const correlationId = resolveCorrelationId(request.header("x-correlation-id"));
    if (isHealthReport(exception)) {
      response.status(503).json(exception.getResponse());
      return;
    }
    const mapped = mapException(exception);
    response.setHeader("x-correlation-id", correlationId);
    response.status(mapped.status).json({ ...mapped.body, correlationId });
  }
}

function isHealthReport(exception: unknown): exception is HttpException {
  if (!(exception instanceof HttpException)) {
    return false;
  }
  const body = exception.getResponse();
  return typeof body === "object" && body !== null && "postgres" in body;
}

function mapException(exception: unknown): { status: number; body: ErrorBody } {
  if (exception instanceof AuthFailure) {
    return { status: exception.status, body: { code: exception.code, message: exception.message } };
  }
  if (exception instanceof HttpException) {
    return { status: exception.getStatus(), body: httpBody(exception) };
  }
  return { status: 500, body: { code: "unavailable", message: "The request could not be completed." } };
}

function httpBody(exception: HttpException): ErrorBody {
  const status = exception.getStatus();
  const code = status === 429 ? "rate_limited" : status === 403 ? "forbidden" : status === 404 ? "not_found" : "validation_failed";
  return { code, message: status === 500 ? "The request could not be completed." : exception.message };
}
