import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server as HttpServer } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  CallToolResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListToolsResultSchema,
  ReadResourceResultSchema
} from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it } from "vitest";
import { createStreamableHttpApp } from "../src/server/transports/streamableHttp.js";

let server: HttpServer | undefined;
let client: Client | undefined;
let transport: StreamableHTTPClientTransport | undefined;

afterEach(async () => {
  if (transport) {
    await transport.close();
    transport = undefined;
  }

  client = undefined;

  if (server) {
    server.close();
    await once(server, "close");
    server = undefined;
  }
});

describe("streamable HTTP transport", () => {
  it("lists tools and returns structured tool results", async () => {
    const app = createStreamableHttpApp();

    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address() as AddressInfo;
    client = new Client({
      name: "template-test-client",
      version: "1.0.0"
    });
    transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${String(address.port)}/mcp`)
    );

    await client.connect(transport as Parameters<typeof client.connect>[0]);

    const tools = await client.request(
      {
        method: "tools/list",
        params: {}
      },
      ListToolsResultSchema
    );

    expect(tools.tools.some((tool) => tool.name === "echo")).toBe(true);

    const echoTool = tools.tools.find((tool) => tool.name === "echo");
    expect(echoTool?.outputSchema).toBeTruthy();
    expect(echoTool?.annotations?.readOnlyHint).toBe(true);

    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "echo",
          arguments: {
            text: "hello"
          }
        }
      },
      CallToolResultSchema
    );

    expect(result.structuredContent).toEqual({ text: "hello" });
    expect(result.isError).not.toBe(true);
  });

  it("rejects GET requests on the MCP endpoint when no mcp-session-id header is present", async () => {
    const app = createStreamableHttpApp();

    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address() as AddressInfo;
    const response = await fetch(
      `http://127.0.0.1:${String(address.port)}/mcp`
    );
    const body = (await response.json()) as {
      error: {
        message: string;
      };
    };

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Missing mcp-session-id header.");
  });

  it("exposes a health endpoint for container orchestration", async () => {
    const app = createStreamableHttpApp();

    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address() as AddressInfo;
    const response = await fetch(
      `http://127.0.0.1:${String(address.port)}/healthz`
    );
    const body = (await response.json()) as {
      status: string;
      transport: string;
      name: string;
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.transport).toBe("streamable-http");
    expect(body.name).toBeTruthy();
  });

  it("exposes parameterized prompt and resource examples", async () => {
    const app = createStreamableHttpApp();

    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address() as AddressInfo;
    client = new Client({
      name: "template-test-client",
      version: "1.0.0"
    });
    transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${String(address.port)}/mcp`)
    );

    await client.connect(transport as Parameters<typeof client.connect>[0]);

    const prompts = await client.request(
      {
        method: "prompts/list",
        params: {}
      },
      ListPromptsResultSchema
    );

    expect(
      prompts.prompts.some((prompt) => prompt.name === "draft_tool_spec")
    ).toBe(true);

    const prompt = await client.request(
      {
        method: "prompts/get",
        params: {
          name: "draft_tool_spec",
          arguments: {
            toolName: "search-docs",
            userGoal:
              "Find the most relevant internal documentation page for a question.",
            sideEffects: "none"
          }
        }
      },
      GetPromptResultSchema
    );

    expect(prompt.messages[0]?.content.type).toBe("text");
    if (prompt.messages[0]?.content.type === "text") {
      expect(prompt.messages[0].content.text).toContain("search-docs");
    }

    const resource = await client.request(
      {
        method: "resources/read",
        params: {
          uri: "resource://server/guides/tools"
        }
      },
      ReadResourceResultSchema
    );

    const firstContent = resource.contents[0];

    expect(firstContent).toBeTruthy();
    if (firstContent && "text" in firstContent) {
      expect(firstContent.text).toContain("structuredContent");
    }
  });
});
