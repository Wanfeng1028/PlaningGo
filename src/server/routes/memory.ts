/**
 * Memory 路由
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listMemories, upsertMemory, deleteMemory } from "../services/store.js";
import { sendOk, sendCreated, sendNoContent, sendError } from "../common/response.js";

export async function registerMemoryRoutes(app: FastifyInstance) {
  // GET /api/memories — 返回数组（前端直接用）
  app.get("/api/memories", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    return sendOk(reply, listMemories());
  });

  app.post("/api/memories", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const input = z
      .object({
        category: z.enum(["family", "food", "route", "collaboration"]),
        title: z.string(),
        detail: z.string(),
        weight: z.number().min(0).max(1),
      })
      .parse(request.body);
    return sendCreated(reply, upsertMemory(input));
  });

  app.patch("/api/memories/:id", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      category: z.enum(["family", "food", "route", "collaboration"]).optional(),
      title: z.string().optional(),
      detail: z.string().optional(),
      weight: z.number().min(0).max(1).optional(),
    }).parse(request.body);
    const result = upsertMemory({ id: params.id, ...body } as Parameters<typeof upsertMemory>[0]);
    return sendOk(reply, result);
  });

  app.delete("/api/memories/:id", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const ok = deleteMemory(params.id);
    if (!ok) return sendError(reply, 404, "MEMORY_NOT_FOUND", "记忆不存在");
    return sendOk(reply, { ok: true });
  });
}
