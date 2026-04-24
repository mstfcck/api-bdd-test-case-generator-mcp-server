import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withToolErrorHandling } from "../lib/toolHandler.js";
import { examplePrompts } from "../prompts/index.js";
import { staticResources, templateResources } from "../resources/index.js";
import { toolRegistry } from "../tools/index.js";

export function registerServerFeatures(server: McpServer): void {
  for (const tool of toolRegistry) {
    server.registerTool(
      tool.definition.name,
      tool.definition as Parameters<typeof server.registerTool>[1],
      withToolErrorHandling(tool.handler) as Parameters<
        typeof server.registerTool
      >[2]
    );
  }

  for (const resource of staticResources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType
      },
      () => ({
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: resource.text
          }
        ]
      })
    );
  }

  for (const resource of templateResources) {
    server.registerResource(
      resource.name,
      resource.template,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType
      },
      (uri, variables) => resource.read(uri, variables)
    );
  }

  for (const prompt of examplePrompts) {
    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
        argsSchema: prompt.argsSchema
      },
      (arguments_: unknown) => ({
        messages: prompt.messages(arguments_)
      })
    );
  }
}
