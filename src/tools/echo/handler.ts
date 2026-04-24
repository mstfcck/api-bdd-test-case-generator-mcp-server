import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";
import {
  echoToolInputValidator,
  echoToolOutputValidator
} from "./definition.js";

export function echoToolHandler(input: unknown): ToolResponse {
  const { text } = echoToolInputValidator.parse(input);
  const output = echoToolOutputValidator.parse({ text });
  return jsonResponse(output);
}
