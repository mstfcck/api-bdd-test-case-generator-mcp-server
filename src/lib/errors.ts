import { ZodError } from "zod";

export function toErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map(
        (issue) =>
          `${issue.path.length > 0 ? issue.path.join(".") : "value"}: ${issue.message}`
      )
      .join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
