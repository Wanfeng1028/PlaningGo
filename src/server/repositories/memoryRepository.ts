/**
 * Memory 仓库
 */

import type { PrismaClient } from "../../generated/prisma/client.js";

export class MemoryRepository {
  constructor(private db: PrismaClient) {}

  async listByUserId(userId: string) {
    return this.db.memory.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    userId: string;
    category: string;
    title: string;
    detail: string;
    weight?: number;
    source?: string;
  }) {
    return this.db.memory.create({
      data: {
        userId: data.userId,
        category: data.category,
        title: data.title,
        detail: data.detail,
        weight: data.weight ?? 0.5,
        source: data.source ?? "user",
      },
    });
  }

  async softDelete(id: string, userId: string) {
    const memory = await this.db.memory.findFirst({ where: { id, userId, deletedAt: null } });
    if (!memory) return null;
    return this.db.memory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async deleteAllByUserId(userId: string) {
    return this.db.memory.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
