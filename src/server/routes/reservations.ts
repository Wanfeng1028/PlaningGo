/**
 * Reservations 路由
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listReservations, upsertReservation, updateReservationStatus } from "../services/store.js";

export async function registerReservationRoutes(app: FastifyInstance) {
  app.get("/api/reservations", { preHandler: [app.optionalAuthGuard] }, async () => ({
    items: listReservations(),
  }));

  app.post("/api/reservations", { preHandler: [app.optionalAuthGuard] }, async (request) => {
    const input = z
      .object({
        type: z.enum(["restaurant", "ticket", "activity", "delivery"]),
        title: z.string(),
        status: z.enum(["draft", "holding", "confirmed", "failed"]).default("draft"),
        price: z.string().optional(),
        detail: z.string(),
      })
      .parse(request.body);
    return upsertReservation(input);
  });

  app.patch("/api/reservations/:id/status", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(["draft", "holding", "confirmed", "failed"]) }).parse(request.body);
    const next = updateReservationStatus(params.id, body.status);
    if (!next) return reply.status(404).send({ error: "RESERVATION_NOT_FOUND" });
    return next;
  });
}
