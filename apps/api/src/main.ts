import "reflect-metadata";
import { createApp } from "./create-app";

void bootstrap();

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.API_PORT ?? "3001");
  await app.listen(port);
}
