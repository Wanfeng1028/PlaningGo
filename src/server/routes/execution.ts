/**
 * Execution 路由
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listExecutionSteps, advanceExecution, updateExecutionStep } from "../services/store.js";
import { baseToolLogs } from "../data/mockData.js";

export async function registerExecutionRoutes(app: FastifyInstance) {
  app.get("/api/execution/demo", { preHandler: [app.optionalAuthGuard] }, async () => ({
    traceId: "exec_demo",
    steps: listExecutionSteps(),
  }));

  app.post("/api/execution/advance", { preHandler: [app.optionalAuthGuard] }, async () => ({
    traceId: "exec_demo",
    steps: advanceExecution(),
  }));

  app.patch("/api/execution/:key", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    const params = z.object({ key: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(["pending", "running", "done", "failed"]) }).parse(request.body);
    const next = updateExecutionStep(params.key, body.status);
    if (!next) return reply.status(404).send({ error: "EXECUTION_STEP_NOT_FOUND" });
    return next;
  });

  app.get("/api/tools/logs", { preHandler: [app.optionalAuthGuard] }, async () => ({
    traceId: "demo_trace",
    logs: baseToolLogs,
  }));
}
