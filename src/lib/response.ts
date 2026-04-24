import type { ToolResponse } from "../types/index.js";
import { safeJsonStringify } from "./json.js";

function toStructuredContent(
  data: unknown
): Record<string, unknown> | undefined {
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return undefined;
}

export function textResponse(text: string): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

export function jsonResponse(data: unknown): ToolResponse {
  const response = textResponse(safeJsonStringify(data));
  const structuredContent = toStructuredContent(data);

  if (!structuredContent) {
    return response;
  }

  return {
    ...response,
    structuredContent
  };
}

export function errorResponse(
  message: string,
  details?: Record<string, unknown>
): ToolResponse {
  const payload = details ? { error: message, ...details } : { error: message };

  return {
    ...jsonResponse(payload),
    isError: true
  };
}
