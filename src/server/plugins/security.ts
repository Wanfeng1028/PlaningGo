/**
 * 安全头 + Cookie 插件
 */

import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";

async function securityPlugin(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: false, // SPA 需要关闭 CSP
  });

  await app.register(cookie, {
    secret: process.env.JWT_ACCESS_SECRET ?? "dev-cookie-secret",
  });
}

export default fp(securityPlugin, { name: "security" });
