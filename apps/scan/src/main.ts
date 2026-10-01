import { startScan } from "./start-scan";

void bootstrap();

async function bootstrap(): Promise<void> {
  const handle = await startScan(process.env);
  const shutdown = (): void => {
    void handle.close().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
