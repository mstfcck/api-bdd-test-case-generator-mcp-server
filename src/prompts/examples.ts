import { z } from "zod";

const summarizeServerArgsSchema = {
  focus: z
    .enum(["tools", "resources", "prompts"])
    .optional()
    .describe("Which part of the server should be summarized.")
};

const summarizeServerArgsValidator = z.object(summarizeServerArgsSchema);

const draftToolSpecArgsSchema = {
  toolName: z.string().min(3).describe("Kebab-case name for the new tool."),
  userGoal: z
    .string()
    .min(12)
    .describe("User goal that the tool should unlock."),
  sideEffects: z
    .enum(["none", "local", "external"])
    .optional()
    .describe("Expected side-effect level for the tool.")
};

const draftToolSpecArgsValidator = z.object(draftToolSpecArgsSchema);

export const examplePrompts = [
  {
    name: "summarize_server",
    title: "Summarize Server",
    description:
      "Generate a focused summary of the MCP capabilities exposed by this server.",
    argsSchema: summarizeServerArgsSchema,
    messages: (rawArgs: unknown) => {
      const { focus = "tools" } = summarizeServerArgsValidator.parse(rawArgs);
      return [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Summarize the ${focus} exposed by this MCP server and explain when to use them.`
          }
        }
      ];
    }
  },
  {
    name: "draft_tool_spec",
    title: "Draft Tool Spec",
    description:
      "Turn a user goal into a first-pass MCP tool contract and implementation checklist.",
    argsSchema: draftToolSpecArgsSchema,
    messages: (rawArgs: unknown) => {
      const {
        toolName,
        userGoal,
        sideEffects = "none"
      } = draftToolSpecArgsValidator.parse(rawArgs);
      return [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `Design an MCP tool named ${toolName}.`,
              `Primary user goal: ${userGoal}`,
              `Expected side effects: ${sideEffects}`,
              "Return a proposed description, input schema fields, output schema fields, and recommended annotations.",
              "Call out any validation or safety requirements before implementation."
            ].join("\n")
          }
        }
      ];
    }
  }
] as const;
