import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type AppEnvironment = "development" | "test" | "production";
export type AppTransport = "stdio" | "streamable-http";
export type PinoLogLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"
  | "silent";

export interface AppConfig {
  nodeEnv: AppEnvironment;
  logLevel: PinoLogLevel;
  serverName: string;
  serverVersion: string;
  transport: AppTransport;
  host: string;
  port: number;
  allowedHosts: string[];
  trustProxyHops: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  shutdownGraceMs: number;
}

export type ToolResponse = CallToolResult;
