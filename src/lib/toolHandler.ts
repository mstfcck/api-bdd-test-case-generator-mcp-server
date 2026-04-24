import { logger } from "../config/logger.js";
import type { ToolResponse } from "../types/index.js";
import { toErrorMessage } from "./errors.js";
import { errorResponse } from "./response.js";

type MaybePromise<T> = T | Promise<T>;

export type ToolHandler<TInput = unknown, TExtra = unknown> = (
  input: TInput,
  extra: TExtra
) => MaybePromise<ToolResponse>;

export function withToolErrorHandling<TInput = unknown, TExtra = unknown>(
  handler: ToolHandler<TInput, TExtra>
): ToolHandler<TInput, TExtra> {
  return async (input: TInput, extra: TExtra): Promise<ToolResponse> => {
    try {
      return await handler(input, extra);
    } catch (error: unknown) {
      logger.warn({ error }, "Tool handler failed");
      return errorResponse(toErrorMessage(error));
    }
  };
}
