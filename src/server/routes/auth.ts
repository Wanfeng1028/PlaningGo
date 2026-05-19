/**
 * Auth 路由 — 注册 / 登录 / Guest / Refresh / Logout
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UserRepository } from "../repositories/userRepository.js";
import { ProfileRepository } from "../repositories/profileRepository.js";
import { TokenService } from "../services/tokenService.js";
import { AuthService } from "../services/authService.js";
import { sendOk, sendCreated, sendNoContent, sendError } from "../common/response.js";

const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位"),
  displayName: z.string().max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const guestProfileSchema = z.object({
  city: z.string().optional(),
  startPoint: z.string().optional(),
  companions: z.enum(["family", "friends", "couple", "solo"]).optional(),
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  homeLat: z.number().optional(),
  homeLng: z.number().optional(),
  locationLabel: z.string().optional(),
  locationSource: z.enum(["browser", "manual", "default"]).optional(),
}).optional();

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

function getClientMeta(request: { headers: Record<string, string | string[] | undefined>; ip: string }) {
  return {
    userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
    ipAddress: request.ip,
  };
}

export async function registerAuthRoutes(app: FastifyInstance) {
  const userRepo = new UserRepository(app.db);
  const profileRepo = new ProfileRepository(app.db);
  const tokenService = new TokenService(userRepo);
  const authService = new AuthService(userRepo, profileRepo, tokenService);

  // ── POST /api/auth/register ──
  app.post("/api/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body.email, body.password, body.displayName, getClientMeta(request));
    return sendCreated(reply, result);
  });

  // ── POST /api/auth/login ──
  app.post("/api/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await authService.login(body.email, body.password, getClientMeta(request));
    return sendOk(reply, result);
  });

  // ── POST /api/auth/guest ──
  app.post("/api/auth/guest", async (request, reply) => {
    const profile = guestProfileSchema.parse(request.body) ?? undefined;
    const result = await authService.guestLogin(getClientMeta(request), profile);
    return sendCreated(reply, result);
  });

  // ── POST /api/auth/demo ──（兼容旧 API）
  app.post("/api/auth/demo", async (request, reply) => {
    const result = await authService.demoLogin(getClientMeta(request));
    return sendOk(reply, result);
  });

  // ── POST /api/auth/refresh ──
  app.post("/api/auth/refresh", async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body);
    const result = await tokenService.refreshTokens(body.refreshToken, getClientMeta(request));
    if (!result) return sendError(reply, 401, "TOKEN_EXPIRED", "Refresh token 无效或已过期");
    return sendOk(reply, result);
  });

  // ── POST /api/auth/logout ──
  app.post("/api/auth/logout", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body);
    await tokenService.revokeRefreshToken(body.refreshToken);
    return sendNoContent(reply);
  });

  // ── POST /api/auth/logout-all ──
  app.post("/api/auth/logout-all", { preHandler: [app.authGuard] }, async (request, reply) => {
    await tokenService.revokeAllTokens(request.userId!);
    return sendNoContent(reply);
  });

  // ── POST /api/auth/change-password ──
  app.post("/api/auth/change-password", { preHandler: [app.authGuard] }, async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    await authService.changePassword(request.userId!, body.oldPassword, body.newPassword);
    return sendNoContent(reply);
  });
}
