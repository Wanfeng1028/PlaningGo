/**
 * Profile è·¯ç± â?ä¸ªäººä¸­å¿å¨éæ¥å£
 *
 * åå«: Profile / Persona / Companions / Insights / History / Rating
 *        Notifications / Permissions / Sessions / Privacy / Developer
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { sendOk, sendCreated, sendNoContent } from "../common/response.js";
import { NotFoundError, ConflictError, BadRequestError, UnauthorizedError } from "../common/errors.js";

// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Helpers
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function uid(req: FastifyRequest): string {
  const id = req.userId;
  if (!id) throw new UnauthorizedError("æªç»å½?);
  return id;
}

/** Safely parse a Prisma JSON field to an array */
function parseJsonArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

/** Safely parse a Prisma JSON field to an object */
function parseJsonObject(val: unknown): Record<string, unknown> {
  if (val && typeof val === "object" && !Array.isArray(val)) return val as Record<string, unknown>;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return {};
}

// ââ Persona completeness calculation ââ

const PERSONA_FIELDS: Array<{ key: string; default: unknown }> = [
  { key: "displayName", default: "" },
  { key: "city", default: "æ­å·" },
  { key: "startPoint", default: "æµå¤§ç´«éæ¸? },
  { key: "defaultTimeWindow", default: "ä¸å14:00-18:00" },
  { key: "transportMode", default: "æ­¥è¡ä¼å" },
  { key: "walkingTolerance", default: "éä¸­" },
  { key: "queueTolerance", default: "éä¸­" },
  { key: "pace", default: "éä¸­" },
  { key: "indoorPreference", default: "å¹³è¡¡" },
  { key: "budgetMin", default: 0 },
  { key: "budgetMax", default: 500 },
  { key: "dietPreference", default: [] },
  { key: "avoidFoods", default: [] },
  { key: "healthGoal", default: "" },
  { key: "dinnerTimePreference", default: "18:00-19:00" },
  { key: "activityTags", default: [] },
  { key: "avoidActivityTags", default: [] },
  { key: "riskPreference", default: "ä¸­æ? },
  { key: "secondaryStartPoints", default: [] },
  { key: "favoriteAreas", default: [] },
  { key: "distanceLimitKm", default: 10 },
];

function calcPersonaCompleteness(profile: Record<string, unknown>): number {
  let filled = 0;
  for (const field of PERSONA_FIELDS) {
    const val = profile[field.key];
    const def = field.default;
    if (Array.isArray(def)) {
      const arr = parseJsonArray(val);
      if (arr.length > 0) filled++;
    } else if (typeof def === "number") {
      if (val != null && val !== def) filled++;
    } else {
      if (val != null && val !== "" && val !== def) filled++;
    }
  }
  return Math.round((filled / PERSONA_FIELDS.length) * 100);
}

/** Format a Prisma UserProfile row into a clean API response */
function formatProfile(profile: Record<string, any>, user?: Record<string, any>) {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: user?.displayName ?? "",
    city: profile.city,
    startPoint: profile.startPoint,
    secondaryStartPoints: parseJsonArray(profile.secondaryStartPoints),
    favoriteAreas: parseJsonArray(profile.favoriteAreas),
    defaultTimeWindow: profile.defaultTimeWindow,
    transportMode: profile.transportMode,
    distanceLimitKm: profile.distanceLimitKm,
    walkingTolerance: profile.walkingTolerance,
    queueTolerance: profile.queueTolerance,
    pace: profile.pace,
    indoorPreference: profile.indoorPreference,
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    dietPreference: parseJsonArray(profile.dietPreference),
    avoidFoods: parseJsonArray(profile.avoidFoods),
    healthGoal: profile.healthGoal,
    dinnerTimePreference: profile.dinnerTimePreference,
    activityTags: parseJsonArray(profile.activityTags),
    avoidActivityTags: parseJsonArray(profile.avoidActivityTags),
    riskPreference: profile.riskPreference,
    personaCompleteness: profile.personaCompleteness,
    planCount: profile.planCount,
  };
}

/** Seed default notifications for a user if none exist */
async function seedNotifications(db: PrismaClient, userId: string): Promise<void> {
  const count = await db.notification.count({ where: { userId } });
  if (count > 0) return;

  await db.notification.createMany({
    data: [
      {
        userId,
        type: "welcome",
        title: "æ¬¢è¿ä½¿ç¨å¨æ«æè°±",
        message: "å®åä½ çä¸ªäººç»åï¼è·å¾æ´ç²¾åçæ¨èï¼",
        read: false,
      },
      {
        userId,
        type: "tip",
        title: "è¯è¯ AI è§å",
        message: "æè¿°ä½ çå¨æ«æ³æ³ï¼AI ä¼ä¸ºä½ çæå®å¶æ¹æ¡ã?,
        read: false,
      },
      {
        userId,
        type: "system",
        title: "éç§è®¾ç½®æé",
        message: "ä½ å¯ä»¥å¨ä¸ªäººä¸­å¿ç®¡çæ°æ®æéåéç§éé¡¹ã?,
        read: false,
      },
    ],
  });
}

/** Seed default notification preferences if none exist */
async function ensureNotificationPrefs(db: PrismaClient, userId: string) {
  return db.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Route Plugin
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function registerProfileRoutes(app: FastifyInstance) {
  const db: PrismaClient = app.db;

  // Protect ALL routes in this plugin
  app.addHook("onRequest", async (request) => {
    await (request as any).jwtVerify();
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 1. GET /api/profile/me â?Get full profile bundle
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/profile/me", async (request, reply) => {
    const userId = uid(request);

    const [user, profile, permissions] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, displayName: true, mode: true, role: true, createdAt: true },
      }),
      db.userProfile.findUnique({ where: { userId } }),
      db.userPermission.findUnique({ where: { userId } }),
    ]);

    if (!user) throw new NotFoundError("ç¨æ·ä¸å­å?, "USER_NOT_FOUND");

    // Seed notifications on first access
    await seedNotifications(db, userId);

    const [planCount, memoryCount, favoriteCount, unreadNotifications] = await Promise.all([
      db.plan.count({ where: { userId } }),
      db.memory.count({ where: { userId, deletedAt: null } }),
      // Favorite count â?plan doesn't have favorite field in real schema, count non-draft plans
      db.plan.count({ where: { userId, status: { not: "draft" } } }),
      db.notification.count({ where: { userId, read: false } }),
    ]);

    // Upsert profile if missing
    const safeProfile = profile ?? await db.userProfile.create({ data: { userId } });
    const safePerms = permissions ?? await db.userPermission.create({ data: { userId } });

    sendOk(reply, {
      user,
      profile: formatProfile(safeProfile, user),
      permissions: {
        locationEnabled: safePerms.locationEnabled,
        memoryEnabled: safePerms.memoryEnabled,
        calendarEnabled: safePerms.calendarEnabled,
        shareEnabled: safePerms.shareEnabled,
        developerEnabled: safePerms.developerEnabled,
      },
      stats: {
        planCount,
        memoryCount,
        favoriteCount,
        unreadNotifications,
        personaCompleteness: safeProfile.personaCompleteness,
      },
    });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 2. PATCH /api/profile/me â?Update profile display info
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.patch("/api/profile/me", async (request, reply) => {
    const userId = uid(request);
    const body = z.object({
      displayName: z.string().max(50).optional(),
      city: z.string().max(50).optional(),
      startPoint: z.string().max(200).optional(),
    }).parse(request.body);

    // Update user displayName if provided
    if (body.displayName !== undefined) {
      await db.user.update({ where: { id: userId }, data: { displayName: body.displayName } });
    }

    // Update profile
    const profile = await db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        city: body.city ?? "æ­å·",
        startPoint: body.startPoint ?? "æµå¤§ç´«éæ¸?,
      },
      update: {
        ...(body.city !== undefined && { city: body.city }),
        ...(body.startPoint !== undefined && { startPoint: body.startPoint }),
      },
    });

    // Recalculate persona completeness
    const completeness = calcPersonaCompleteness(profile as unknown as Record<string, unknown>);
    await db.userProfile.update({ where: { userId }, data: { personaCompleteness: completeness } });

    const user = await db.user.findUnique({ where: { id: userId }, select: { displayName: true } });
    sendOk(reply, formatProfile({ ...profile, personaCompleteness: completeness }, user ?? undefined));
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 3. GET /api/profile/me/persona â?Get persona data
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/profile/me/persona", async (request, reply) => {
    const userId = uid(request);
    const profile = await db.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError("ç¨æ·ç»åä¸å­å?);

    sendOk(reply, formatProfile(profile));
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 4. PATCH /api/profile/me/persona â?Update persona preferences
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.patch("/api/profile/me/persona", async (request, reply) => {
    const userId = uid(request);
    const body = z.object({
      city: z.string().optional(),
      startPoint: z.string().optional(),
      secondaryStartPoints: z.array(z.string()).optional(),
      favoriteAreas: z.array(z.string()).optional(),
      defaultTimeWindow: z.string().optional(),
      transportMode: z.string().optional(),
      distanceLimitKm: z.number().optional(),
      walkingTolerance: z.string().optional(),
      queueTolerance: z.string().optional(),
      pace: z.string().optional(),
      indoorPreference: z.string().optional(),
      budgetMin: z.number().int().optional(),
      budgetMax: z.number().int().optional(),
      dietPreference: z.array(z.string()).optional(),
      avoidFoods: z.array(z.string()).optional(),
      healthGoal: z.string().optional(),
      dinnerTimePreference: z.string().optional(),
      activityTags: z.array(z.string()).optional(),
      avoidActivityTags: z.array(z.string()).optional(),
      riskPreference: z.string().optional(),
    }).parse(request.body);

    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(body)) {
      if (val === undefined) continue;
      if (Array.isArray(val)) {
        data[key] = JSON.stringify(val);
      } else {
        data[key] = val;
      }
    }

    const profile = await db.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // Recalculate persona completeness
    const completeness = calcPersonaCompleteness(profile as unknown as Record<string, unknown>);
    await db.userProfile.update({ where: { userId }, data: { personaCompleteness: completeness } });

    sendOk(reply, formatProfile({ ...profile, personaCompleteness: completeness }));
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 5. GET /api/profile/me/companions â?List companions
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/profile/me/companions", async (request, reply) => {
    const userId = uid(request);
    const companions = await db.companion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    sendOk(reply, companions.map((c) => ({
      ...c,
      preferences: parseJsonArray(c.preferences),
      avoid: parseJsonArray(c.avoid),
      diet: typeof c.diet === "string" ? c.diet : c.diet,
    })));
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 6. POST /api/profile/me/companions â?Create companion
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.post("/api/profile/me/companions", async (request, reply) => {
    const userId = uid(request);
    const body = z.object({
      type: z.string().default("person"),
      name: z.string().min(1).max(50),
      relation: z.string().default(""),
      ageGroup: z.string().default("adult"),
      preferences: z.array(z.string()).default([]),
      avoid: z.array(z.string()).default([]),
      mobility: z.string().default("normal"),
      diet: z.string().default(""),
      notes: z.string().default(""),
      isDefault: z.boolean().default(false),
    }).parse(request.body);

    const companion = await db.companion.create({
      data: {
        userId,
        type: body.type,
        name: body.name,
        relation: body.relation,
        ageGroup: body.ageGroup,
        preferences: JSON.stringify(body.preferences),
        avoid: JSON.stringify(body.avoid),
        mobility: body.mobility,
        diet: body.diet,
        notes: body.notes,
        isDefault: body.isDefault,
      },
    });

    sendCreated(reply, {
      ...companion,
      preferences: parseJsonArray(companion.preferences),
      avoid: parseJsonArray(companion.avoid),
    });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 7. PATCH /api/profile/me/companions/:id â?Update companion
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.patch("/api/profile/me/companions/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      type: z.string().optional(),
      name: z.string().min(1).max(50).optional(),
      relation: z.string().optional(),
      ageGroup: z.string().optional(),
      preferences: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
      mobility: z.string().optional(),
      diet: z.string().optional(),
      notes: z.string().optional(),
      isDefault: z.boolean().optional(),
    }).parse(request.body);

    // Verify ownership
    const existing = await db.companion.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError("åè¡äººä¸å­å¨", "COMPANION_NOT_FOUND");

    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(body)) {
      if (val === undefined) continue;
      if (Array.isArray(val)) {
        data[key] = JSON.stringify(val);
      } else {
        data[key] = val;
      }
    }

    const companion = await db.companion.update({ where: { id }, data });
    sendOk(reply, {
      ...companion,
      preferences: parseJsonArray(companion.preferences),
      avoid: parseJsonArray(companion.avoid),
    });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 8. DELETE /api/profile/me/companions/:id â?Delete companion
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.delete("/api/profile/me/companions/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const existing = await db.companion.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError("åè¡äººä¸å­å¨", "COMPANION_NOT_FOUND");

    await db.companion.delete({ where: { id } });
    sendNoContent(reply);
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 9. GET /api/profile/me/insights â?Get AI insights (mock)
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/profile/me/insights", async (request, reply) => {
    const userId = uid(request);

    const [profile, memories, planCount] = await Promise.all([
      db.userProfile.findUnique({ where: { userId } }),
      db.memory.findMany({ where: { userId, deletedAt: null }, orderBy: { weight: "desc" }, take: 10 }),
      db.plan.count({ where: { userId } }),
    ]);

    const topCategories = memories.reduce<Record<string, number>>((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    const topCategory = Object.entries(topCategories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";

    const completeness = profile?.personaCompleteness ?? 0;

    const insights = [
      {
        id: "insight_activity",
        type: "recommendation",
        title: "æ´»å¨åå¥½æ´å¯",
        description: profile
          ? `ä½ åå¥?{parseJsonArray(profile.activityTags).join("ã?) || "å°æªè®¾å®"}ç±»åçæ´»å¨ãå®ååå¥½å¯è·å¾æ´ç²¾åæ¨èã`
          : "å®åä½ çæ´»å¨åå¥½ï¼è·å¾æ´ç²¾åçå¨æ«æ¨èã?,
        icon: "sparkles",
      },
      {
        id: "insight_food",
        type: "recommendation",
        title: "é¥®é£åå¥½åæ",
        description: profile
          ? `ä½ çé¥®é£åå¥½ä¸?{parseJsonArray(profile.dietPreference).join("ã?) || "æªè®¾å®?}ï¼å¿å?{parseJsonArray(profile.avoidFoods).join("ã?) || "æ?}ã`
          : "åè¯æä»¬ä½ çé¥®é£åå¥½ï¼å¸®ä½ é¿å¼ä¸åéçéæ©ã?,
        icon: "utensils",
      },
      {
        id: "insight_persona",
        type: "progress",
        title: "ç»åå®æåº?,
        description: `ä½ çä¸ªäººç»åå·²å®æ?${completeness}%ï¼?{completeness >= 80 ? "éå¸¸å®å" : "è¿ææåç©ºé´"}ã`,
        icon: "user",
        progress: completeness,
      },
      {
        id: "insight_memory",
        type: "memory",
        title: "è®°å¿æ´å¯",
        description: memories.length > 0
          ? `ä½ æ ${memories.length} æ¡é¿æè®°å¿ï¼æå¸¸å³æ³¨ã?{topCategory}ãé¢åã`
          : "å¼å§è§åå¨æ«ï¼ç³»ç»ä¼èªå¨è®°å½ä½ çåå¥½ã?,
        icon: "brain",
      },
      {
        id: "insight_plans",
        type: "stats",
        title: "è§åç»è®¡",
        description: `ä½ å·²çæ ${planCount} ä¸ªè§åæ¹æ¡ã?{planCount > 5 ? "ä½ æ¯èµæ·±è§åå¸ï¼" : "ç»§ç»­æ¢ç´¢æ´å¤å¯è½æ§å§ã?}`,
        icon: "bar-chart",
      },
    ];

    sendOk(reply, { insights });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 10. GET /api/profile/me/history â?Get plan history
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/profile/me/history", async (request, reply) => {
    const userId = uid(request);
    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(request.query);

    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      db.plan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
        select: {
          id: true,
          title: true,
          summary: true,
          status: true,
          createdAt: true,
        },
      }),
      db.plan.count({ where: { userId } }),
    ]);

    sendOk(reply, { items, total });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 11. POST /api/plans/:id/rating â?Rate a plan
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.post("/api/plans/:id/rating", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      rating: z.number().int().min(1).max(5),
      favorite: z.boolean().optional(),
    }).parse(request.body);

    const plan = await db.plan.findFirst({ where: { id, userId } });
    if (!plan) throw new NotFoundError("è§åä¸å­å?, "PLAN_NOT_FOUND");

    // Store rating in intent metadata (Plan model uses Json intent field)
    const intent = parseJsonObject(plan.intent);
    intent.rating = body.rating;
    if (body.favorite !== undefined) intent.favorite = body.favorite;

    const updated = await db.plan.update({
      where: { id },
      data: { intent: JSON.stringify(intent) },
    });

    sendOk(reply, { id: updated.id, rating: body.rating, favorite: body.favorite ?? false });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 12. GET /api/notifications â?List notifications
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/notifications", async (request, reply) => {
    const userId = uid(request);

    // Seed notifications on first access
    await seedNotifications(db, userId);

    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(request.query);

    const skip = (query.page - 1) * query.pageSize;

    const [items, total, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      db.notification.count({ where: { userId } }),
      db.notification.count({ where: { userId, read: false } }),
    ]);

    sendOk(reply, { items, total, unread });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 13. PATCH /api/notifications/:id/read â?Mark notification read
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.patch("/api/notifications/:id/read", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const notification = await db.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundError("éç¥ä¸å­å?, "NOTIFICATION_NOT_FOUND");

    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });

    sendOk(reply, updated);
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 14. DELETE /api/notifications/:id â?Delete notification
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.delete("/api/notifications/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const notification = await db.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundError("éç¥ä¸å­å?, "NOTIFICATION_NOT_FOUND");

    await db.notification.delete({ where: { id } });
    sendNoContent(reply);
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 15. GET /api/notifications/preferences â?Get notification prefs
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/notifications/preferences", async (request, reply) => {
    const userId = uid(request);
    const prefs = await ensureNotificationPrefs(db, userId);
    sendOk(reply, prefs);
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 16. PATCH /api/notifications/preferences â?Update notification prefs
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.patch("/api/notifications/preferences", async (request, reply) => {
    const userId = uid(request);
    const body = z.object({
      departureReminder: z.boolean().optional(),
      reservationReminder: z.boolean().optional(),
      shareFeedback: z.boolean().optional(),
      weatherAlert: z.boolean().optional(),
      planExpiry: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      browserEnabled: z.boolean().optional(),
      calendarEnabled: z.boolean().optional(),
    }).parse(request.body);

    const prefs = await db.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...body },
      update: body,
    });

    sendOk(reply, prefs);
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 17. GET /api/profile/me/permissions â?Get permission settings
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/profile/me/permissions", async (request, reply) => {
    const userId = uid(request);
    const perms = await db.userPermission.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    sendOk(reply, {
      locationEnabled: perms.locationEnabled,
      memoryEnabled: perms.memoryEnabled,
      calendarEnabled: perms.calendarEnabled,
      shareEnabled: perms.shareEnabled,
      developerEnabled: perms.developerEnabled,
    });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 18. PATCH /api/profile/me/permissions â?Update permissions
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.patch("/api/profile/me/permissions", async (request, reply) => {
    const userId = uid(request);
    const body = z.object({
      locationEnabled: z.boolean().optional(),
      memoryEnabled: z.boolean().optional(),
      calendarEnabled: z.boolean().optional(),
      shareEnabled: z.boolean().optional(),
      developerEnabled: z.boolean().optional(),
    }).parse(request.body);

    const perms = await db.userPermission.upsert({
      where: { userId },
      create: { userId, ...body },
      update: body,
    });

    sendOk(reply, {
      locationEnabled: perms.locationEnabled,
      memoryEnabled: perms.memoryEnabled,
      calendarEnabled: perms.calendarEnabled,
      shareEnabled: perms.shareEnabled,
      developerEnabled: perms.developerEnabled,
    });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 19. GET /api/auth/sessions â?List user sessions
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.get("/api/auth/sessions", async (request, reply) => {
    const userId = uid(request);
    const sessions = await db.userSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastSeenAt: true,
      },
    });

    sendOk(reply, { sessions });
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // 20. DELETE /api/auth/sessions/:id â?Revoke a session
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  app.delete("/api/auth/sessions/:id", async (request, reply) => {
    const userId = uid(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const session = await db.userSession.findFirst({ where: { id, userId, revokedAt: null } });
    if (!session) throw new NotFoundError("?????");

    await db.userSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    sendNoContent(reply);
  });
}

export default registerProfileRoutes;
