export type LogFields = {
  message: string;
  correlationId: string;
  status?: string;
};

export type Logger = {
  info: (fields: LogFields) => void;
};

export function createLogger(
  service: string,
  sink: (line: string) => void = writeStdout,
): Logger {
  return {
    info(fields: LogFields): void {
      sink(JSON.stringify(toRecord(service, fields)));
    },
  };
}

function toRecord(service: string, fields: LogFields): Record<string, string> {
  const record: Record<string, string> = {
    level: "info",
    service,
    time: new Date().toISOString(),
    message: fields.message,
    correlationId: fields.correlationId,
  };
  if (fields.status !== undefined) {
    record.status = fields.status;
  }
  return record;
}

function writeStdout(line: string): void {
  process.stdout.write(`${line}\n`);
}
