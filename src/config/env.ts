import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";
import type { AppConfig, PinoLogLevel } from "../types/index.js";

dotenv.config();

// Read name and version from package.json so they stay in sync automatically.
const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJsonSchema = z.object({ name: z.string(), version: z.string() });
const rawPkg = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf-8")
) as unknown;
const pkg = packageJsonSchema.parse(rawPkg);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum([
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
      "silent"
    ] as const)
    .default("info") satisfies z.ZodType<PinoLogLevel>,
  MCP_SERVER_NAME: z.string().min(1).default(pkg.name),
  MCP_SERVER_VERSION: z.string().min(1).default(pkg.version),
  MCP_TRANSPORT: z.enum(["stdio", "streamable-http"]).default("stdio"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(3000),
  MCP_ALLOWED_HOSTS: z.string().default(""),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  MCP_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  MCP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  MCP_SHUTDOWN_GRACE_MS: z.coerce.number().int().positive().default(10_000)
});

const parsed = envSchema.parse(process.env);
const allowedHosts = parsed.MCP_ALLOWED_HOSTS.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const env: AppConfig = {
  nodeEnv: parsed.NODE_ENV,
  logLevel: parsed.LOG_LEVEL,
  serverName: parsed.MCP_SERVER_NAME,
  serverVersion: parsed.MCP_SERVER_VERSION,
  transport: parsed.MCP_TRANSPORT,
  host: parsed.HOST,
  port: parsed.PORT,
  allowedHosts,
  trustProxyHops: parsed.TRUST_PROXY_HOPS,
  rateLimitWindowMs: parsed.MCP_RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsed.MCP_RATE_LIMIT_MAX,
  shutdownGraceMs: parsed.MCP_SHUTDOWN_GRACE_MS
};
