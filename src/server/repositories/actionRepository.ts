/**
 * Action 仓库 — Action + ActionEvent CRUD
 */

import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";

export class ActionRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string) {
    return this.db.action.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.db.action.findFirst({
      where: { id, userId },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
  }

  async listByUserId(userId: string, limit = 50) {
    return this.db.action.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async create(data: {
    userId: string;
    planId?: string;
    planOptionId?: string;
    type: string;
    status?: string;
    confirmationRequired?: boolean;
    idempotencyKey: string;
    payload?: Record<string, unknown>;
    expiresAt?: Date;
  }) {
    return this.db.action.create({
      data: {
        userId: data.userId,
        planId: data.planId ?? null,
        planOptionId: data.planOptionId ?? null,
        type: data.type,
        status: data.status ?? "proposed",
        confirmationRequired: data.confirmationRequired ?? true,
        idempotencyKey: data.idempotencyKey,
        payload: (data.payload ?? {}) as unknown as Prisma.InputJsonValue,
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  async updateStatus(id: string, status: string, data?: { result?: Record<string, unknown>; errorCode?: string; errorMessage?: string }) {
    return this.db.action.update({
      where: { id },
      data: {
        status,
        ...(data?.result && { result: data.result as unknown as Prisma.InputJsonValue }),
        ...(data?.errorCode && { errorCode: data.errorCode }),
        ...(data?.errorMessage && { errorMessage: data.errorMessage }),
      },
    });
  }

  async setQuote(id: string, quote: Record<string, unknown>) {
    return this.db.action.update({
      where: { id },
      data: { quote: quote as unknown as Prisma.InputJsonValue, status: "quoted" },
    });
  }

  async addEvent(actionId: string, data: {
    eventType: string;
    fromStatus?: string;
    toStatus?: string;
    payload?: Record<string, unknown>;
    traceId?: string;
  }) {
    return this.db.actionEvent.create({
      data: {
        actionId,
        eventType: data.eventType,
        fromStatus: data.fromStatus ?? null,
        toStatus: data.toStatus ?? null,
        payload: (data.payload ?? {}) as unknown as Prisma.InputJsonValue,
        traceId: data.traceId ?? "",
      },
    });
  }
}
