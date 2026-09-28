import { retryApprovedPromotions } from "./promote-version";
import { startWorker } from "./start-worker";

void bootstrap();

async function bootstrap(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined || redisUrl.length === 0) {
    throw new Error("REDIS_URL is required");
  }
  const handle = await startWorker(redisUrl);
  if (process.env.DATABASE_URL !== undefined) {
    await retryApprovedPromotions();
  }
  const shutdown = (): void => {
    void handle.close().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
