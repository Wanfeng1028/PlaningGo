/**
 * Developer 仓库 — API Keys + Webhooks + WebhookDeliveries
 */

import crypto from "node:crypto";
import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";

export class DeveloperRepository {
  constructor(private db: PrismaClient) {}

  // ── API Keys ──

  async listApiKeys(userId: string) {
    return this.db.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createApiKey(userId: string, name: string, scopes: string[] = []) {
    const rawKey = `pg_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const prefix = rawKey.slice(0, 7);

    const apiKey = await this.db.apiKey.create({
      data: {
        userId,
        name,
        keyHash,
        prefix,
        scopes: scopes as unknown as Prisma.InputJsonValue,
      },
    });

    return { apiKey, rawKey };
  }

  async revokeApiKey(id: string, userId: string) {
    const key = await this.db.apiKey.findFirst({ where: { id, userId } });
    if (!key) return null;
    return this.db.apiKey.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }

  async findApiKeyByKeyHash(keyHash: string) {
    return this.db.apiKey.findFirst({
      where: { keyHash, status: "active" },
    });
  }

  async touchApiKey(id: string) {
    return this.db.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  // ── Webhooks ──

  async listWebhooks(userId: string) {
    return this.db.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createWebhook(data: {
    userId: string;
    url: string;
    event: string;
    secret?: string;
  }) {
    const secretHash = data.secret
      ? crypto.createHash("sha256").update(data.secret).digest("hex")
      : "";

    return this.db.webhook.create({
      data: {
        userId: data.userId,
        url: data.url,
        event: data.event,
        secretHash,
      },
    });
  }

  async findWebhookById(id: string) {
    return this.db.webhook.findUnique({ where: { id } });
  }

  async findActiveWebhooksByEvent(userId: string, event: string) {
    return this.db.webhook.findMany({
      where: { userId, event, enabled: true },
    });
  }

  async recordDelivery(data: {
    webhookId: string;
    event: string;
    payload: Record<string, unknown>;
    status?: string;
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
  }) {
    return this.db.webhookDelivery.create({
      data: {
        webhookId: data.webhookId,
        event: data.event,
        payload: data.payload as unknown as Prisma.InputJsonValue,
        status: data.status ?? "pending",
        responseStatus: data.responseStatus ?? null,
        responseBody: data.responseBody ?? null,
        errorMessage: data.errorMessage ?? null,
      },
    });
  }

  async updateDelivery(id: string, data: {
    status: string;
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
    attemptCount?: number;
  }) {
    return this.db.webhookDelivery.update({
      where: { id },
      data,
    });
  }

  async getDeliveriesByWebhookId(webhookId: string, limit = 20) {
    return this.db.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
