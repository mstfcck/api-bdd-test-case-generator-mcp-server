import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const guideTopicSchema = z.enum([
  "tools",
  "resources",
  "prompts",
  "transports"
]);

const guideTextByTopic = {
  tools: [
    "# Tool Guide",
    "",
    "Use tools for actions, computation, or external I/O.",
    "Return both text content and structuredContent when outputSchema is defined.",
    "Prefer actionable descriptions and accurate annotations."
  ].join("\n"),
  resources: [
    "# Resource Guide",
    "",
    "Use resources for read-only context that clients may fetch repeatedly.",
    "Prefer stable URIs and lightweight payloads.",
    "Use templates when the resource is naturally parameterized by a path segment."
  ].join("\n"),
  prompts: [
    "# Prompt Guide",
    "",
    "Prompts should help clients bootstrap common workflows.",
    "Prefer explicit argsSchema fields with descriptive parameter text.",
    "Keep prompts reusable and focused on one goal."
  ].join("\n"),
  transports: [
    "# Transport Guide",
    "",
    "Use stdio for local spawned integrations.",
    "Use streamable-http for remote deployments and multi-client access.",
    "Bind to localhost by default unless you have explicit auth and host validation in place."
  ].join("\n")
} as const;

export const staticResources = [
  {
    uri: "resource://server/about",
    name: "server_about",
    title: "About This Server",
    description:
      "Template metadata and guidance for extending the starter server.",
    mimeType: "application/json",
    text: JSON.stringify(
      {
        name: "mcp-server-typescript-template",
        description: "Production-oriented TypeScript MCP starter template",
        transports: ["stdio", "streamable-http"],
        extensionPoints: ["tools", "resources", "prompts"],
        exampleGuideUri: "resource://server/guides/tools"
      },
      null,
      2
    )
  },
  {
    uri: "resource://server/checklists/release-readiness",
    name: "release_readiness_checklist",
    title: "Release Readiness Checklist",
    description: "A concrete release checklist for template maintainers.",
    mimeType: "text/markdown",
    text: [
      "# Release Readiness Checklist",
      "",
      "- Run `npm run check` on Node 22.",
      "- Validate stdio startup with a local MCP client.",
      "- Validate `/mcp` initialization and one tool call over HTTP.",
      "- Review README snippets from a clean clone.",
      "- Confirm generated tool scaffolds still register cleanly."
    ].join("\n")
  }
] as const;

export const templateResources = [
  {
    name: "server_guide",
    title: "Server Guide",
    description: "Focused guidance for a single MCP template topic.",
    template: new ResourceTemplate("resource://server/guides/{topic}", {
      list: undefined
    }),
    mimeType: "text/markdown",
    read: (uri: URL, params: Record<string, string | string[]>) => {
      const topic = guideTopicSchema.parse(params["topic"]);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: guideTextByTopic[topic]
          }
        ]
      };
    }
  }
] as const;
