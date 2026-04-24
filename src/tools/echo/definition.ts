import { z } from "zod";

export const echoToolInputSchema = {
  text: z.string().min(1).describe("Text to echo back.")
} as const;

export const echoToolInputValidator = z.object(echoToolInputSchema);

export const echoToolOutputSchema = {
  text: z.string().describe("The echoed text.")
} as const;

export const echoToolOutputValidator = z.object(echoToolOutputSchema);

export const echoToolDefinition = {
  name: "echo",
  title: "Echo Text",
  description: "Echoes back validated text and returns a structured payload.",
  inputSchema: echoToolInputSchema,
  outputSchema: echoToolOutputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
} as const;
