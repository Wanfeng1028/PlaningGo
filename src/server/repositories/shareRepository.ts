/**
 * Share 仓库 — ShareRoom + ShareVote
 */

import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";

export class ShareRepository {
  constructor(private db: PrismaClient) {}

  async listByUserId(userId: string) {
    return this.db.shareRoom.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { votes: true },
    });
  }

  async findById(id: string) {
    return this.db.shareRoom.findUnique({
      where: { id },
      include: { votes: true },
    });
  }

  async findByInviteCode(inviteCode: string) {
    return this.db.shareRoom.findUnique({
      where: { inviteCode },
      include: { votes: true },
    });
  }

  async create(data: {
    userId: string;
    planId?: string;
    title: string;
    inviteCode: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.shareRoom.create({
      data: {
        userId: data.userId,
        planId: data.planId ?? null,
        title: data.title,
        inviteCode: data.inviteCode,
        metadata: (data.metadata ?? {}) as unknown as Prisma.InputJsonValue,
      },
      include: { votes: true },
    });
  }

  async addVote(roomId: string, data: {
    memberName: string;
    vote: string;
    comment?: string;
  }) {
    return this.db.shareVote.create({
      data: {
        roomId,
        memberName: data.memberName,
        vote: data.vote,
        comment: data.comment ?? null,
      },
    });
  }

  async getVotes(roomId: string) {
    return this.db.shareVote.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
    });
  }
}
