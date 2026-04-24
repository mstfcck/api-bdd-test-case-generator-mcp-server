import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";
import { healthCheckToolOutputValidator } from "./definition.js";

export function healthCheckToolHandler(): ToolResponse {
  const output = healthCheckToolOutputValidator.parse({
    status: "ok",
    timestamp: new Date().toISOString()
  });
  return jsonResponse(output);
}
