import { describe, expect, it } from "vitest";
import { env } from "../src/config/env.js";

const PINO_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent"
] as const;

describe("env", () => {
  it("should expose config values", () => {
    expect(env.serverName).toBeTruthy();
    expect(env.serverVersion).toBeTruthy();
  });

  it("logLevel is a valid pino level", () => {
    expect(PINO_LEVELS).toContain(env.logLevel);
  });

  it("port is a positive integer", () => {
    expect(Number.isInteger(env.port)).toBe(true);
    expect(env.port).toBeGreaterThan(0);
  });

  it("allowedHosts is an array", () => {
    expect(Array.isArray(env.allowedHosts)).toBe(true);
  });
});
