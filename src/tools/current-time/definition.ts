import { z } from "zod";

export const currentTimeToolOutputSchema = {
  now: z.string().describe("Current server time as an ISO-8601 string."),
  timeZone: z.string().describe("IANA timezone resolved by the server runtime.")
} as const;

export const currentTimeToolOutputValidator = z.object(
  currentTimeToolOutputSchema
);

export const currentTimeToolDefinition = {
  name: "current_time",
  title: "Current Time",
  description: "Returns the current server time and resolved IANA timezone.",
  inputSchema: {},
  outputSchema: currentTimeToolOutputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
} as const;
