import { buildApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = await buildApp();

  // ── Graceful Shutdown ──
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`收到 ${signal}，开始优雅关闭...`);
      await app.close();
      process.exit(0);
    });
  }

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Server ready at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

main();
