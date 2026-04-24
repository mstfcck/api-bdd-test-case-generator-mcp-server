import pino from "pino";
import { env } from "./env.js";

const transport =
  env.nodeEnv === "development"
    ? {
        target: "pino-pretty",
        options: { colorize: true, ignore: "pid,hostname" }
      }
    : undefined;

export const logger = pino({
  level: env.logLevel,
  base: null,
  messageKey: "message",
  ...(transport !== undefined && { transport })
});
