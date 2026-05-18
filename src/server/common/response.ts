/**
 * 统一 API 响应构造器
 * 所有接口返回格式一致：{ ok, data?, error?, traceId, meta? }
 */

import type { FastifyReply } from "fastify";

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    issues?: unknown[];
  };
  traceId: string;
  meta?: Record<string, unknown>;
}

function getTraceId(reply: FastifyReply): string {
  return (reply.request as typeof reply.request & { traceId?: string }).traceId ?? "unknown";
}

export function sendOk<T>(reply: FastifyReply, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  const body: ApiResponse<T> = { ok: true, data, traceId: getTraceId(reply) };
  if (meta) body.meta = meta;
  return reply.status(statusCode).send(body);
}

export function sendCreated<T>(reply: FastifyReply, data: T) {
  return sendOk(reply, data, 201);
}

export function sendNoContent(reply: FastifyReply) {
  return reply.status(204).send();
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  issues?: unknown[],
) {
  const body: ApiResponse = {
    ok: false,
    error: { code, message, issues },
    traceId: getTraceId(reply),
  };
  return reply.status(statusCode).send(body);
}
