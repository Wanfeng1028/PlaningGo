/**
 * 用户 Profile 仓库 — 封装 UserProfile + UserPermission 操作
 */

import type { PrismaClient } from "../../generated/prisma/client.js";

export interface ProfileUpdateData {
  city?: string;
  startPoint?: string;
  homeLat?: number;
  homeLng?: number;
  companions?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferences?: string[];
  familyInfo?: unknown[];
}

export interface PermissionUpdateData {
  locationEnabled?: boolean;
  memoryEnabled?: boolean;
  calendarEnabled?: boolean;
  shareEnabled?: boolean;
  developerEnabled?: boolean;
}

export class ProfileRepository {
  constructor(private db: PrismaClient) {}

  async findByUserId(userId: string) {
    return this.db.userProfile.findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: ProfileUpdateData) {
    return this.db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        city: data.city ?? "北京",
        startPoint: data.startPoint ?? "家附近",
        homeLat: data.homeLat ?? null,
        homeLng: data.homeLng ?? null,
        companions: data.companions ?? "family",
        budgetMin: data.budgetMin ?? 200,
        budgetMax: data.budgetMax ?? 300,
        preferences: (data.preferences ?? []) as unknown as Record<string, never>,
        familyInfo: (data.familyInfo ?? []) as unknown as Record<string, never>,
      },
      update: {
        ...(data.city !== undefined && { city: data.city }),
        ...(data.startPoint !== undefined && { startPoint: data.startPoint }),
        ...(data.homeLat !== undefined && { homeLat: data.homeLat }),
        ...(data.homeLng !== undefined && { homeLng: data.homeLng }),
        ...(data.companions !== undefined && { companions: data.companions }),
        ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
        ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
        ...(data.preferences !== undefined && { preferences: data.preferences as unknown as Record<string, never> }),
        ...(data.familyInfo !== undefined && { familyInfo: data.familyInfo as unknown as Record<string, never> }),
      },
    });
  }

  // ── Permissions ──

  async getPermissions(userId: string) {
    return this.db.userPermission.findUnique({ where: { userId } });
  }

  async upsertPermissions(userId: string, data: PermissionUpdateData) {
    return this.db.userPermission.upsert({
      where: { userId },
      create: {
        userId,
        locationEnabled: data.locationEnabled ?? true,
        memoryEnabled: data.memoryEnabled ?? true,
        calendarEnabled: data.calendarEnabled ?? false,
        shareEnabled: data.shareEnabled ?? true,
        developerEnabled: data.developerEnabled ?? false,
      },
      update: {
        ...(data.locationEnabled !== undefined && { locationEnabled: data.locationEnabled }),
        ...(data.memoryEnabled !== undefined && { memoryEnabled: data.memoryEnabled }),
        ...(data.calendarEnabled !== undefined && { calendarEnabled: data.calendarEnabled }),
        ...(data.shareEnabled !== undefined && { shareEnabled: data.shareEnabled }),
        ...(data.developerEnabled !== undefined && { developerEnabled: data.developerEnabled }),
      },
    });
  }

  /**
   * 获取完整的用户 profile + permissions（兼容旧 API 响应格式）
   */
  async getFullProfile(userId: string) {
    const [user, profile, permissions] = await Promise.all([
      this.db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, displayName: true, role: true, mode: true, createdAt: true } }),
      this.findByUserId(userId),
      this.getPermissions(userId),
    ]);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      mode: user.mode,
      createdAt: user.createdAt,
      city: profile?.city ?? "北京",
      startPoint: profile?.startPoint ?? "家附近",
      homeLat: profile?.homeLat ?? undefined,
      homeLng: profile?.homeLng ?? undefined,
      companions: profile?.companions ?? "family",
      budgetMin: profile?.budgetMin ?? 200,
      budgetMax: profile?.budgetMax ?? 300,
      preferences: profile?.preferences ?? [],
      familyInfo: profile?.familyInfo ?? [],
      permissions: {
        location: permissions?.locationEnabled ?? true,
        memory: permissions?.memoryEnabled ?? true,
        calendar: permissions?.calendarEnabled ?? false,
        share: permissions?.shareEnabled ?? true,
        developer: permissions?.developerEnabled ?? false,
      },
    };
  }
}
