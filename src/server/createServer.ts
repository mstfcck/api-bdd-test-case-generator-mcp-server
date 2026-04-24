import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { env } from "../config/env.js";
import { registerServerFeatures } from "./register.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: env.serverName,
    version: env.serverVersion
  });

  registerServerFeatures(server);
  return server;
}
