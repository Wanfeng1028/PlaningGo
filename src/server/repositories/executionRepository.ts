/**
 * Execution 仓库
 */

import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";

export class ExecutionRepository {
  constructor(private db: PrismaClient) {}

  async listByUserId(userId: string) {
    return this.db.executionStep.findMany({
      where: { userId },
      orderBy: { orderIndex: "asc" },
    });
  }

  async upsert(userId: string, key: string, data: {
    title: string;
    status?: string;
    orderIndex?: number;
    planId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.executionStep.upsert({
      where: { id: `${userId}-${key}` },
      create: {
        userId,
        planId: data.planId ?? null,
        key,
        title: data.title,
        status: data.status ?? "pending",
        orderIndex: data.orderIndex ?? 0,
        metadata: (data.metadata ?? {}) as unknown as Prisma.InputJsonValue,
      },
      update: {
        title: data.title,
        ...(data.status && { status: data.status }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.metadata && { metadata: data.metadata as unknown as Prisma.InputJsonValue }),
      },
    }).catch(() => {
      // fallback: find first then create/update
      return this.db.executionStep.findFirst({ where: { userId, key } }).then((existing) => {
        if (existing) {
          return this.db.executionStep.update({
            where: { id: existing.id },
            data: {
              title: data.title,
              ...(data.status && { status: data.status }),
              ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
              ...(data.metadata && { metadata: data.metadata as unknown as Prisma.InputJsonValue }),
            },
          });
        }
        return this.db.executionStep.create({
          data: {
            userId,
            planId: data.planId ?? null,
            key,
            title: data.title,
            status: data.status ?? "pending",
            orderIndex: data.orderIndex ?? 0,
            metadata: (data.metadata ?? {}) as unknown as Prisma.InputJsonValue,
          },
        });
      });
    });
  }

  async updateByKey(userId: string, key: string, data: { status?: string; metadata?: Record<string, unknown> }) {
    const existing = await this.db.executionStep.findFirst({ where: { userId, key } });
    if (!existing) return null;
    return this.db.executionStep.update({
      where: { id: existing.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.metadata && { metadata: data.metadata as unknown as Prisma.InputJsonValue }),
      },
    });
  }

  async clearByUserId(userId: string) {
    return this.db.executionStep.deleteMany({ where: { userId } });
  }
}
