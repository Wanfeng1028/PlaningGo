/**
 * Reservation 仓库
 */

import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";

export class ReservationRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string) {
    return this.db.reservation.findUnique({ where: { id } });
  }

  async listByUserId(userId: string) {
    return this.db.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    userId: string;
    actionId?: string;
    type: string;
    title: string;
    status?: string;
    price?: string;
    detail?: string;
    provider?: string;
    providerRef?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.reservation.create({
      data: {
        userId: data.userId,
        actionId: data.actionId ?? null,
        type: data.type,
        title: data.title,
        status: data.status ?? "draft",
        price: data.price ?? null,
        detail: data.detail ?? "",
        provider: data.provider ?? "mock",
        providerRef: data.providerRef ?? null,
        metadata: (data.metadata ?? {}) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.db.reservation.update({
      where: { id },
      data: { status },
    });
  }
}
