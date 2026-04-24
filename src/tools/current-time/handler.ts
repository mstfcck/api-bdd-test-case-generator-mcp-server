import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";
import { currentTimeToolOutputValidator } from "./definition.js";

export function currentTimeToolHandler(): ToolResponse {
  const output = currentTimeToolOutputValidator.parse({
    now: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  return jsonResponse(output);
}
