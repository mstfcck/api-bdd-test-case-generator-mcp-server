import type { ToolResponse } from "../../types/index.js";
import { env } from "../../config/env.js";
import { jsonResponse } from "../../lib/response.js";
import { serverInfoToolOutputValidator } from "./definition.js";

export function serverInfoToolHandler(): ToolResponse {
  const output = serverInfoToolOutputValidator.parse({
    name: env.serverName,
    version: env.serverVersion,
    transport: env.transport,
    environment: env.nodeEnv
  });
  return jsonResponse(output);
}
