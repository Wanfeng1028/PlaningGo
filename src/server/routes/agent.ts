/**
 * Agent 路由 — /api/agent/*
 */

import type { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import { parseDemand, planningRequestSchema, runPlanningAgent, simulateWhatIf } from "../services/agent.js";
import { runPlanningPipeline } from "../modules/agent/orchestrator.js";
import { saveActions } from "../services/store.js";

export async function registerAgentRoutes(app: FastifyInstance) {
  app.post("/api/agent/parse", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    try {
      const input = planningRequestSchema.parse(request.body);
      return parseDemand(input);
    } catch (error) {
      if (error instanceof ZodError) return reply.status(400).send({ error: "INVALID_REQUEST", issues: error.issues });
      throw error;
    }
  });

  app.post("/api/agent/plan", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    try {
      const input = planningRequestSchema.parse(request.body);
      const result = await runPlanningPipeline(input);
      if (result.executableActions.length > 0) {
        saveActions(result.executableActions);
      }
      return result;
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: "INVALID_REQUEST", issues: error.issues });
      }
      throw error;
    }
  });

  app.post("/api/agent/plan/legacy", { preHandler: [app.optionalAuthGuard] }, async (request, reply) => {
    try {
      const input = planningRequestSchema.parse(request.body);
      return runPlanningAgent(input);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: "INVALID_REQUEST", issues: error.issues });
      }
      throw error;
    }
  });

  app.post("/api/agent/what-if", { preHandler: [app.optionalAuthGuard] }, async (request) => {
    const input = z
      .object({
        planId: z.string().default("plan_a"),
        scenario: z.enum(["rain", "late", "budget", "traffic"]),
      })
      .parse(request.body);
    return simulateWhatIf(input.planId, input.scenario);
  });
}
