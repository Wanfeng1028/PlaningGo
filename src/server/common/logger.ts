/**
 * 结构化日志
 * 开发环境用 pino-pretty 彩色输出，生产环境输出 JSON
 */

import pino from "pino";

export function createLogger() {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    level: isDev ? "debug" : "info",
    transport: isDev
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" } }
      : undefined,
  });
}

export type Logger = pino.Logger;
