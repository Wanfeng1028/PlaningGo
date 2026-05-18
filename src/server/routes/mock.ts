/**
 * Mock Data 路由 — /api/mock/*
 */

import type { FastifyInstance } from "fastify";
import { demoProfile, pois, trafficRoutes, weather } from "../data/mockData.js";

export async function registerMockRoutes(app: FastifyInstance) {
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
}
