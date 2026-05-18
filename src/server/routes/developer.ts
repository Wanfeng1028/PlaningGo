/**
 * Developer 路由
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  listWebhooks,
  upsertWebhook,
  replayWebhook,
} from "../services/store.js";
import { baseToolLogs } from "../data/mockData.js";
import { sendOk, sendCreated, sendNoContent, sendError } from "../common/response.js";

export async function registerDeveloperRoutes(app: FastifyInstance) {
  // ── Dashboard ──
  app.get("/api/developer/dashboard", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const keys = listApiKeys();
    const hooks = listWebhooks();
    return sendOk(reply, {
      metrics: [
        { label: "规划成功率", value: "94%" },
        { label: "兜底触发率", value: "18%" },
        { label: "支付交接率", value: "100%" },
        { label: "用户确认率", value: "87%" },
      ],
      logs: baseToolLogs,
      apiKeys: keys,
      webhooks: hooks,
    });
  });

  // ── API Keys ── (兼容前端 /api/developer/apikeys 路径)
  app.get("/api/developer/apikeys", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    return sendOk(reply, listApiKeys());
  });

  // 兼容旧路径
  app.get("/api/developer/api-keys", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    return sendOk(reply, listApiKeys());
  });

  app.post("/api/developer/apikeys", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const input = z
      .object({
        name: z.string().default("Demo Key"),
        scopes: z.array(z.string()).default(["plan:read", "tool:read"]),
      })
      .parse(request.body ?? {});
    return sendCreated(reply, createApiKey(input.name, input.scopes));
  });

  // 兼容旧路径
  app.post("/api/developer/api-keys", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const input = z
      .object({
        name: z.string().default("Demo Key"),
        scopes: z.array(z.string()).default(["plan:read", "tool:read"]),
      })
      .parse(request.body ?? {});
    return sendCreated(reply, createApiKey(input.name, input.scopes));
  });

  // DELETE /api/developer/apikeys/:id — 兼容前端 DELETE 方法
  app.delete("/api/developer/apikeys/:id", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const next = revokeApiKey(params.id);
    if (!next) return sendError(reply, 404, "API_KEY_NOT_FOUND", "API Key 不存在");
    return sendOk(reply, next);
  });

  // 兼容旧路径 POST /revoke
  app.post("/api/developer/api-keys/:id/revoke", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const next = revokeApiKey(params.id);
    if (!next) return sendError(reply, 404, "API_KEY_NOT_FOUND", "API Key 不存在");
    return sendOk(reply, next);
  });

  // ── Webhooks ──
  app.get("/api/developer/webhooks", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    return sendOk(reply, listWebhooks());
  });

  app.post("/api/developer/webhooks", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const input = z
      .object({
        url: z.string().url(),
        event: z.enum(["plan.created", "reservation.updated", "execution.failed", "share.voted"]),
        enabled: z.boolean().default(true),
      })
      .parse(request.body);
    return sendCreated(reply, upsertWebhook(input));
  });

  app.patch("/api/developer/webhooks/:id", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      url: z.string().url().optional(),
      event: z.string().optional(),
      enabled: z.boolean().optional(),
    }).parse(request.body);
    const next = upsertWebhook({ id: params.id, ...body } as Parameters<typeof upsertWebhook>[0]);
    return sendOk(reply, next);
  });

  app.delete("/api/developer/webhooks/:id", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    return sendOk(reply, { ok: true, id: request.params });
  });

  app.post("/api/developer/webhooks/:id/replay", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const next = replayWebhook(params.id);
    if (!next) return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook 不存在");
    return sendOk(reply, next);
  });

  app.get("/api/developer/webhooks/:id/deliveries", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    return sendOk(reply, []);
  });

  // ── Tool Logs ──
  app.get("/api/developer/logs", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(request.query);
    const start = (query.page - 1) * query.pageSize;
    const items = baseToolLogs.slice(start, start + query.pageSize);
    return sendOk(reply, { items, total: baseToolLogs.length });
  });
}
