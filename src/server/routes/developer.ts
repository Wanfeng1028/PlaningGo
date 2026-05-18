/**
 * Developer 路由 — Prisma 版
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";
import { baseToolLogs } from "../data/mockData.js";
import { sendOk, sendCreated, sendNoContent, sendError } from "../common/response.js";
import { UnauthorizedError } from "../common/errors.js";

function uid(req: FastifyRequest): string {
  const id = (req as any).userId;
  if (!id) throw new UnauthorizedError("未登录");
  return id;
}

export async function registerDeveloperRoutes(app: FastifyInstance) {
  const db = app.db;

  // ── Dashboard ──
  app.get("/api/developer/dashboard", async (request, reply) => {
    const userId = uid(request);
    const [keys, hooks] = await Promise.all([
      db.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      db.webhook.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);
    return sendOk(reply, {
      metrics: [
        { label: "规划成功率", value: "94%" },
        { label: "兜底触发率", value: "18%" },
        { label: "支付交接率", value: "100%" },
        { label: "用户确认率", value: "87%" },
      ],
      logs: baseToolLogs,
      apiKeys: keys.map(mapApiKey),
      webhooks: hooks.map(mapWebhook),
    });
  });

  // ── API Keys ──
  app.get("/api/developer/apikeys", async (request, reply) => {
    const userId = uid(request);
    const keys = await db.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return sendOk(reply, keys.map(mapApiKey));
  });

  // 兼容旧路径
  app.get("/api/developer/api-keys", async (request, reply) => {
    const userId = uid(request);
    const keys = await db.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return sendOk(reply, keys.map(mapApiKey));
  });

  app.post("/api/developer/apikeys", async (request, reply) => {
    const userId = uid(request);
    const input = z
      .object({
        name: z.string().default("Demo Key"),
        scopes: z.array(z.string()).default(["plan:read", "tool:read"]),
      })
      .parse(request.body ?? {});

    const rawKey = `pg_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const prefix = rawKey.slice(0, 7);

    const apiKey = await db.apiKey.create({
      data: {
        userId,
        name: input.name,
        keyHash,
        prefix,
        scopes: input.scopes as any,
      },
    });

    return sendCreated(reply, { ...mapApiKey(apiKey), key: rawKey });
  });

  // 兼容旧路径
  app.post("/api/developer/api-keys", async (request, reply) => {
    const userId = uid(request);
    const input = z
      .object({
        name: z.string().default("Demo Key"),
        scopes: z.array(z.string()).default(["plan:read", "tool:read"]),
      })
      .parse(request.body ?? {});

    const rawKey = `pg_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const prefix = rawKey.slice(0, 7);

    const apiKey = await db.apiKey.create({
      data: {
        userId,
        name: input.name,
        keyHash,
        prefix,
        scopes: input.scopes as any,
      },
    });

    return sendCreated(reply, { ...mapApiKey(apiKey), key: rawKey });
  });

  // DELETE /api/developer/apikeys/:id
  app.delete("/api/developer/apikeys/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const key = await db.apiKey.findFirst({ where: { id, userId } });
    if (!key) return sendError(reply, 404, "API_KEY_NOT_FOUND", "API Key 不存在");

    const updated = await db.apiKey.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
    return sendOk(reply, mapApiKey(updated));
  });

  // 兼容旧路径 POST /revoke
  app.post("/api/developer/api-keys/:id/revoke", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const key = await db.apiKey.findFirst({ where: { id, userId } });
    if (!key) return sendError(reply, 404, "API_KEY_NOT_FOUND", "API Key 不存在");

    const updated = await db.apiKey.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
    return sendOk(reply, mapApiKey(updated));
  });

  // ── Webhooks ──
  app.get("/api/developer/webhooks", async (request, reply) => {
    const userId = uid(request);
    const hooks = await db.webhook.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return sendOk(reply, hooks.map(mapWebhook));
  });

  app.post("/api/developer/webhooks", async (request, reply) => {
    const userId = uid(request);
    const input = z
      .object({
        url: z.string().url(),
        event: z.enum(["plan.created", "reservation.updated", "execution.failed", "share.voted"]),
        enabled: z.boolean().default(true),
      })
      .parse(request.body);

    const webhook = await db.webhook.create({
      data: { userId, url: input.url, event: input.event, enabled: input.enabled },
    });
    return sendCreated(reply, mapWebhook(webhook));
  });

  app.patch("/api/developer/webhooks/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        url: z.string().url().optional(),
        event: z.string().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(request.body);

    const existing = await db.webhook.findFirst({ where: { id, userId } });
    if (!existing) return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook 不存在");

    const webhook = await db.webhook.update({ where: { id }, data: body });
    return sendOk(reply, mapWebhook(webhook));
  });

  app.delete("/api/developer/webhooks/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const existing = await db.webhook.findFirst({ where: { id, userId } });
    if (!existing) return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook 不存在");

    await db.webhook.delete({ where: { id } });
    return sendNoContent(reply);
  });

  app.post("/api/developer/webhooks/:id/replay", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const webhook = await db.webhook.findFirst({ where: { id, userId } });
    if (!webhook) return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook 不存在");

    const delivery = await db.webhookDelivery.create({
      data: {
        webhookId: id,
        event: webhook.event,
        payload: {} as any,
        status: "success",
        responseStatus: 200,
      },
    });
    return sendOk(reply, delivery);
  });

  app.get("/api/developer/webhooks/:id/deliveries", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const webhook = await db.webhook.findFirst({ where: { id, userId } });
    if (!webhook) return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook 不存在");

    const deliveries = await db.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return sendOk(reply, deliveries);
  });

  // ── Tool Logs (mock data for now) ──
  app.get("/api/developer/logs", async (request, reply) => {
    uid(request); // require auth
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      })
      .parse(request.query);
    const start = (query.page - 1) * query.pageSize;
    const items = baseToolLogs.slice(start, start + query.pageSize);
    return sendOk(reply, { items, total: baseToolLogs.length });
  });
}

// ── Helpers ──

function mapApiKey(key: any) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    scopes: key.scopes,
    status: key.status,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
  };
}

function mapWebhook(hook: any) {
  return {
    id: hook.id,
    url: hook.url,
    event: hook.event,
    enabled: hook.enabled,
    secret: hook.secretHash ? "••••••••" : undefined,
    createdAt: hook.createdAt,
  };
}
