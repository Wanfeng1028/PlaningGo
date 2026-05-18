/**
 * Actions 路由
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listActions, quoteAction, confirmAction, cancelAction } from "../services/store.js";

export async function registerActionRoutes(app: FastifyInstance) {
  app.get("/api/actions", { preHandler: [app.optionalAuthGuard] }, async (request) => {
    const query = z.object({ planId: z.string().optional() }).parse(request.query);
    return { items: listActions(query.planId) };
  });

  app.post("/api/actions/:id/quote", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = quoteAction(params.id);
    if (!result) return reply.status(404).send({ ok: false, error: "ACTION_NOT_FOUND" });
    return result;
  });

  app.post("/api/actions/:id/confirm", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ userConfirmed: z.boolean().default(true) }).parse(request.body ?? {});
    if (!body.userConfirmed) return reply.status(400).send({ ok: false, error: "CONFIRM_REQUIRED" });
    const result = confirmAction(params.id);
    if (!result) return reply.status(404).send({ ok: false, error: "ACTION_NOT_FOUND" });
    return result;
  });

  app.post("/api/actions/:id/cancel", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = cancelAction(params.id);
    if (!result) return reply.status(404).send({ ok: false, error: "ACTION_NOT_FOUND" });
    return result;
  });
}
