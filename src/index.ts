#!/usr/bin/env node
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startStdioServer } from "./server/transports/stdio.js";
import { startStreamableHttpServer } from "./server/transports/streamableHttp.js";

async function main(): Promise<void> {
  if (env.transport === "stdio") {
    await startStdioServer();
    return;
  }

  await startStreamableHttpServer();
}

main().catch((error: unknown) => {
  logger.error(error);
  process.exitCode = 1;
});
