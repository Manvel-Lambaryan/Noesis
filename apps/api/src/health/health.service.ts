import { Injectable } from "@nestjs/common";
import { PrismaService } from "../infrastructure/prisma.service";
import { RedisService } from "../infrastructure/redis.service";

const REQUIRED_SCHEMAS = ["catalog", "commerce", "identity", "ops"] as const;

export type DependencyState = "up" | "down";

export type HealthReport = {
  status: "ok" | "degraded";
  service: "api";
  postgres: DependencyState;
  redis: DependencyState;
  schemas: string[];
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthReport> {
    const schemas = await this.readSchemas();
    const redis = await this.readRedis();
    const postgres = schemas.length === REQUIRED_SCHEMAS.length ? "up" : "down";
    const status = postgres === "up" && redis === "up" ? "ok" : "degraded";
    return { status, service: "api", postgres, redis, schemas };
  }

  private async readSchemas(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('identity', 'catalog', 'commerce', 'ops')
    `;
    return rows.map((row) => row.schema_name).sort();
  }

  private async readRedis(): Promise<DependencyState> {
    try {
      return (await this.redis.client.ping()) === "PONG" ? "up" : "down";
    } catch {
      return "down";
    }
  }
}
