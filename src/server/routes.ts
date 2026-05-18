import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { z } from "zod";
import { demoProfile, pois, baseToolLogs, planOptions, trafficRoutes, weather } from "./data/mockData";
import { parseDemand, planningRequestSchema, runPlanningAgent, simulateWhatIf } from "./services/agent";
import { runPlanningPipeline } from "./modules/agent/orchestrator";
import {
  advanceExecution,
  createShareRoom,
  getSelectedPlanId,
  listExecutionSteps,
  listReservations,
  listShareRooms,
  selectPlan,
  updateExecutionStep,
  updateReservationStatus,
  upsertReservation,
  vote,
  saveActions,
  listActions,
  quoteAction,
  confirmAction,
  cancelAction,
} from "./services/store";

export async function registerRoutes(app: FastifyInstance) {
  // ── 注册模块化路由 ──
  await import("./routes/auth.js").then((m) => m.registerAuthRoutes(app));
  await import("./routes/profile.js").then((m) => m.registerProfileRoutes(app));
  await import("./routes/plans.js").then((m) => m.registerPlanRoutes(app));
  await import("./routes/reservations.js").then((m) => m.registerReservationRoutes(app));
  await import("./routes/execution.js").then((m) => m.registerExecutionRoutes(app));
  await import("./routes/actions.js").then((m) => m.registerActionRoutes(app));
  await import("./routes/share.js").then((m) => m.registerShareRoutes(app));
  await import("./routes/memory.js").then((m) => m.registerMemoryRoutes(app));
  await import("./routes/developer.js").then((m) => m.registerDeveloperRoutes(app));
  await import("./routes/privacy.js").then((m) => m.registerPrivacyRoutes(app));
  await import("./routes/calendar.js").then((m) => m.registerCalendarRoutes(app));
  await import("./routes/agent.js").then((m) => m.registerAgentRoutes(app));
  await import("./routes/mock.js").then((m) => m.registerMockRoutes(app));

  app.get("/api/health", async () => ({
    ok: true,
    service: "planning-go-api",
  }));

  app.get("/api/docs", async () => ({
    name: "PlanningGo API",
    version: "0.1.0",
    groups: [
      { group: "Auth", endpoints: ["POST /api/auth/login", "POST /api/auth/register", "POST /api/auth/guest"] },
      { group: "Profile", endpoints: ["GET /api/profile/demo", "PATCH /api/profile/demo", "GET /api/profile/demo/permissions", "PATCH /api/profile/demo/permissions"] },
      { group: "Planning Agent", endpoints: ["POST /api/agent/parse", "POST /api/agent/plan", "POST /api/agent/plan/legacy", "POST /api/agent/what-if"] },
      { group: "Mock Data", endpoints: ["GET /api/mock/pois", "GET /api/mock/weather", "GET /api/mock/routes"] },
      { group: "Plans", endpoints: ["GET /api/plans/demo", "POST /api/plans/select"] },
      { group: "Reservations", endpoints: ["GET /api/reservations", "POST /api/reservations", "PATCH /api/reservations/:id/status"] },
      { group: "Execution", endpoints: ["GET /api/execution/demo", "POST /api/execution/advance", "PATCH /api/execution/:key", "GET /api/tools/logs"] },
      { group: "Actions", endpoints: ["GET /api/actions", "POST /api/actions/:id/quote", "POST /api/actions/:id/confirm", "POST /api/actions/:id/cancel"] },
      { group: "Share", endpoints: ["GET /api/share/rooms", "POST /api/share/rooms", "POST /api/share/rooms/:id/vote"] },
      { group: "Memory", endpoints: ["GET /api/memories", "POST /api/memories", "DELETE /api/memories/:id"] },
      { group: "Developer", endpoints: ["GET /api/developer/dashboard", "GET /api/developer/api-keys", "POST /api/developer/api-keys", "POST /api/developer/api-keys/:id/revoke", "GET /api/developer/webhooks", "POST /api/developer/webhooks", "POST /api/developer/webhooks/:id/replay"] },
      { group: "Privacy", endpoints: ["GET /api/privacy/export", "DELETE /api/privacy/memories"] },
      { group: "Calendar", endpoints: ["POST /api/ics"] },
    ],
  }));

  app.get("/api/profile/demo", async () => demoProfile);

  app.patch("/api/profile/demo", async (request) => ({
    ...demoProfile,
    ...(request.body as object),
  }));

  app.get("/api/mock/pois", async () => ({
    city: "杭州",
    items: pois,
  }));

  app.get("/api/mock/weather", async () => weather);

  app.get("/api/mock/routes", async () => ({
    startPoint: demoProfile.startPoint,
    destination: "西湖 / 湖滨",
    routes: trafficRoutes,
  }));

  app.get("/api/tools/logs", async () => ({
    traceId: "demo_trace",
    logs: baseToolLogs,
  }));

  app.get("/api/plans/demo", async () => ({
    selectedPlanId: getSelectedPlanId(),
    options: planOptions,
  }));

  app.post("/api/plans/select", async (request, reply) => {
    const input = z.object({ planId: z.string() }).parse(request.body);
    if (!planOptions.some((plan) => plan.id === input.planId)) {
      return reply.status(404).send({ error: "PLAN_NOT_FOUND" });
    }
    return selectPlan(input.planId);
  });

  app.post("/api/agent/parse", async (request, reply) => {
    try {
      const input = planningRequestSchema.parse(request.body);
      return parseDemand(input);
    } catch (error) {
      if (error instanceof ZodError) return reply.status(400).send({ error: "INVALID_REQUEST", issues: error.issues });
      throw error;
    }
  });

  app.post("/api/agent/plan", async (request, reply) => {
    try {
      const input = planningRequestSchema.parse(request.body);
      const result = await runPlanningPipeline(input);
      // 保存生成的 actions 到 store
      if (result.executableActions.length > 0) {
        saveActions(result.executableActions);
      }
      return result;
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: "INVALID_REQUEST",
          issues: error.issues,
        });
      }
      throw error;
    }
  });

  // Legacy mock 规划接口，出问题时可快速回退
  app.post("/api/agent/plan/legacy", async (request, reply) => {
    try {
      const input = planningRequestSchema.parse(request.body);
      return runPlanningAgent(input);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: "INVALID_REQUEST",
          issues: error.issues,
        });
      }
      throw error;
    }
  });

  app.post("/api/agent/what-if", async (request) => {
    const input = z
      .object({
        planId: z.string().default("plan_a"),
        scenario: z.enum(["rain", "late", "budget", "traffic"]),
      })
      .parse(request.body);
    return simulateWhatIf(input.planId, input.scenario);
  });

  app.get("/api/reservations", async () => ({ items: listReservations() }));

  app.post("/api/reservations", async (request) => {
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

  app.patch("/api/reservations/:id/status", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(["draft", "holding", "confirmed", "failed"]) }).parse(request.body);
    const next = updateReservationStatus(params.id, body.status);
    if (!next) return reply.status(404).send({ error: "RESERVATION_NOT_FOUND" });
    return next;
  });

  app.get("/api/execution/demo", async () => ({
    traceId: "exec_demo",
    steps: listExecutionSteps(),
  }));

  app.post("/api/execution/advance", async () => ({
    traceId: "exec_demo",
    steps: advanceExecution(),
  }));

  app.patch("/api/execution/:key", async (request, reply) => {
    const params = z.object({ key: z.string() }).parse(request.params);
    const body = z.object({ status: z.enum(["pending", "running", "done", "failed"]) }).parse(request.body);
    const next = updateExecutionStep(params.key, body.status);
    if (!next) return reply.status(404).send({ error: "EXECUTION_STEP_NOT_FOUND" });
    return next;
  });

  // ========== Actions API ==========

  app.get("/api/actions", async (request) => {
    const query = z.object({ planId: z.string().optional() }).parse(request.query);
    return { items: listActions(query.planId) };
  });

  app.post("/api/actions/:id/quote", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = quoteAction(params.id);
    if (!result) return reply.status(404).send({ ok: false, error: "ACTION_NOT_FOUND" });
    return result;
  });

  app.post("/api/actions/:id/confirm", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ userConfirmed: z.boolean().default(true) }).parse(request.body ?? {});
    if (!body.userConfirmed) return reply.status(400).send({ ok: false, error: "CONFIRM_REQUIRED" });
    const result = confirmAction(params.id);
    if (!result) return reply.status(404).send({ ok: false, error: "ACTION_NOT_FOUND" });
    return result;
  });

  app.post("/api/actions/:id/cancel", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = cancelAction(params.id);
    if (!result) return reply.status(404).send({ ok: false, error: "ACTION_NOT_FOUND" });
    return result;
  });

  // ========== Share API ==========

  app.get("/api/share/rooms", async () => ({ items: listShareRooms() }));

  app.post("/api/share/rooms", async (request) => {
    const input = z
      .object({
        planId: z.string(),
        title: z.string(),
        members: z.array(
          z.object({
            name: z.string(),
            vote: z.enum(["yes", "no", "pending"]).default("pending"),
            comment: z.string().optional(),
          }),
        ),
      })
      .parse(request.body);
    return createShareRoom(input);
  });

  app.post("/api/share/rooms/:id/vote", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ memberName: z.string(), vote: z.enum(["yes", "no"]), comment: z.string().optional() }).parse(request.body);
    const next = vote(params.id, body.memberName, body.vote, body.comment);
    if (!next) return reply.status(404).send({ error: "SHARE_ROOM_NOT_FOUND" });
    return next;
  });













  app.post("/api/ics", async (request, reply) => {
    const body = request.body as { title?: string; date?: string };
    const title = body.title ?? "周末有谱行程";
    const date = body.date ?? "20260509";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PlanningGo//Weekend Agent//CN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@planninggo.local`,
      `DTSTART:${date}T140000`,
      `DTEND:${date}T183000`,
      `SUMMARY:${title}`,
      "DESCRIPTION:由周末有谱 Agent 生成的本地生活规划。",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\\r\\n");

    return reply.header("content-type", "text/calendar; charset=utf-8").send(ics);
  });
}
