const CORRELATION_PATTERN = /^[A-Za-z0-9-]{1,80}$/;

export function resolveCorrelationId(incoming: string | undefined): string {
  if (incoming !== undefined && CORRELATION_PATTERN.test(incoming)) {
    return incoming;
  }
  return crypto.randomUUID();
}
