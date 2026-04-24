import { describe, expect, it } from "vitest";
import { withToolErrorHandling } from "../src/lib/toolHandler.js";
import { toErrorMessage } from "../src/lib/errors.js";

describe("withToolErrorHandling", () => {
  it("passes through successful responses", async () => {
    const handler = withToolErrorHandling(() => ({
      content: [{ type: "text", text: "ok" }]
    }));

    await expect(handler(undefined, undefined)).resolves.toEqual({
      content: [{ type: "text", text: "ok" }]
    });
  });

  it("converts thrown errors into MCP tool errors", async () => {
    const handler = withToolErrorHandling(() => {
      throw new Error("invalid input");
    });

    await expect(handler(undefined, undefined)).resolves.toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "invalid input" })
        }
      ],
      structuredContent: { error: "invalid input" },
      isError: true
    });
  });

  it("formats ZodError issues as clean field messages without raw schema dump", async () => {
    const { z } = await import("zod");

    // Capture a real ZodError via try/catch so we can re-throw it from a
    // function TypeScript sees as always-throwing (return type: never).
    let zodError: unknown;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (err) {
      zodError = err;
    }

    // toErrorMessage must produce a clean "field: message" string
    const msg = toErrorMessage(zodError);
    expect(msg).toContain("name");
    expect(msg).not.toContain('"code"');

    // withToolErrorHandling must surface the same clean message
    const handler = withToolErrorHandling(() => {
      throw zodError;
    });
    const result = await handler(undefined, undefined);
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      error: expect.stringContaining("name") as string
    });
    expect(JSON.stringify(result.structuredContent)).not.toContain('"code"');
  });
});
