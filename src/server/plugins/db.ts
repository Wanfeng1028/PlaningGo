/**
 * Prisma 数据库插件
 * 在 Fastify 生命周期内管理 PrismaClient 连接/断开
 */

import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

async function dbPlugin(app: FastifyInstance) {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://planninggo:planninggo@localhost:5432/planninggo?schema=public";
  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  await db.$connect();
  app.decorate("db", db);

  app.addHook("onClose", async () => {
    await db.$disconnect();
  });
}

export default fp(dbPlugin, { name: "db" });
