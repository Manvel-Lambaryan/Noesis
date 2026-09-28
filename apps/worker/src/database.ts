import { PrismaClient } from "@prisma/client";

let client: PrismaClient | undefined;

export function database(): PrismaClient {
  client ??= new PrismaClient();
  return client;
}

export async function closeDatabase(): Promise<void> {
  if (client === undefined) {
    return;
  }
  await client.$disconnect();
  client = undefined;
}
