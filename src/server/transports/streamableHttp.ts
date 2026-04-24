import { randomUUID } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import rateLimit from "express-rate-limit";
import type { Express, Request, Response } from "express";
import helmet from "helmet";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { createServer } from "../createServer.js";

const MCP_ENDPOINT = "/mcp";
const HEALTH_ENDPOINT = "/healthz";

interface Session {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

function sendJsonRpcError(
  response: Response,
  statusCode: number,
  message: string,
  code = -32000
): void {
  response.status(statusCode).json({
    jsonrpc: "2.0",
    error: {
      code,
      message
    },
    id: null
  });
}

async function handlePostRequest(
  request: Request,
  response: Response,
  sessions: Map<string, Session>
): Promise<void> {
  const sessionId = request.headers["mcp-session-id"];

  // Route to an existing session
  if (typeof sessionId === "string") {
    const session = sessions.get(sessionId);
    if (!session) {
      sendJsonRpcError(response, 404, "Session not found.", -32001);
      return;
    }
    try {
      await session.transport.handleRequest(request, response, request.body);
    } catch (error: unknown) {
      logger.error({ error, sessionId }, "Failed to handle MCP POST request");
      if (!response.headersSent) {
        sendJsonRpcError(response, 500, "Internal server error", -32603);
      }
    }
    return;
  }

  // New session — must be an initialize request
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (newSessionId) => {
      sessions.set(newSessionId, { server, transport });
      logger.info({ sessionId: newSessionId }, "MCP session initialized");
    }
  });

  transport.onclose = () => {
    for (const [id, s] of sessions) {
      if (s.transport === transport) {
        sessions.delete(id);
        logger.info({ sessionId: id }, "MCP session closed");
        break;
      }
    }
    void server.close();
  };

  try {
    // StreamableHTTPServerTransport is structurally compatible with Transport;
    // the single cast is needed only because exactOptionalPropertyTypes makes
    // the optional `onclose` property incompatible with the Transport interface.
    await server.connect(transport as Parameters<typeof server.connect>[0]);
    await transport.handleRequest(request, response, request.body);
  } catch (error: unknown) {
    logger.error({ error }, "Failed to initialize MCP session");
    if (!response.headersSent) {
      sendJsonRpcError(response, 500, "Internal server error", -32603);
    }
    await Promise.allSettled([transport.close(), server.close()]);
  }
}

async function handleGetRequest(
  request: Request,
  response: Response,
  sessions: Map<string, Session>
): Promise<void> {
  const sessionId = request.headers["mcp-session-id"];
  if (typeof sessionId !== "string") {
    sendJsonRpcError(response, 400, "Missing mcp-session-id header.", -32000);
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    sendJsonRpcError(response, 404, "Session not found.", -32001);
    return;
  }

  try {
    await session.transport.handleRequest(request, response);
  } catch (error: unknown) {
    logger.error({ error, sessionId }, "Failed to handle MCP SSE stream");
    if (!response.headersSent) {
      sendJsonRpcError(response, 500, "Internal server error", -32603);
    }
  }
}

async function handleDeleteRequest(
  request: Request,
  response: Response,
  sessions: Map<string, Session>
): Promise<void> {
  const sessionId = request.headers["mcp-session-id"];
  if (typeof sessionId !== "string") {
    sendJsonRpcError(response, 400, "Missing mcp-session-id header.", -32000);
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    sendJsonRpcError(response, 404, "Session not found.", -32001);
    return;
  }

  sessions.delete(sessionId);
  await Promise.allSettled([session.transport.close(), session.server.close()]);
  logger.info({ sessionId }, "MCP session terminated by client");
  response.status(200).end();
}

export function createStreamableHttpApp(): Express {
  // Session store scoped to this app instance (test-friendly)
  const sessions = new Map<string, Session>();

  const app = createMcpExpressApp(
    env.allowedHosts.length > 0
      ? {
          host: env.host,
          allowedHosts: env.allowedHosts
        }
      : {
          host: env.host
        }
  );

  app.disable("x-powered-by");

  if (env.trustProxyHops > 0) {
    app.set("trust proxy", env.trustProxyHops);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (request) => request.path === HEALTH_ENDPOINT
    })
  );

  app.get(HEALTH_ENDPOINT, (_request: Request, response: Response) => {
    response.status(200).json({
      status: "ok",
      transport: "streamable-http",
      name: env.serverName,
      version: env.serverVersion
    });
  });

  app.post(MCP_ENDPOINT, async (request: Request, response: Response) => {
    await handlePostRequest(request, response, sessions);
  });

  app.get(MCP_ENDPOINT, async (request: Request, response: Response) => {
    await handleGetRequest(request, response, sessions);
  });

  app.delete(MCP_ENDPOINT, async (request: Request, response: Response) => {
    await handleDeleteRequest(request, response, sessions);
  });

  return app;
}

function registerShutdownHandlers(server: HttpServer): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, "Shutting down Streamable HTTP server");

    const forceCloseTimer = setTimeout(() => {
      logger.error({ signal }, "HTTP server shutdown exceeded grace period");
      server.closeAllConnections();
      process.exit(1);
    }, env.shutdownGraceMs);

    forceCloseTimer.unref();

    server.close((error?: Error) => {
      clearTimeout(forceCloseTimer);

      if (error) {
        logger.error({ error, signal }, "Failed to close HTTP server cleanly");
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => {
    shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    shutdown("SIGTERM");
  });
}

export async function startStreamableHttpServer(): Promise<void> {
  const app = createStreamableHttpApp();

  const server = await new Promise<HttpServer>((resolve, reject) => {
    const httpServer = app.listen(env.port, env.host, () => {
      resolve(httpServer);
    });
    httpServer.once("error", reject);
  });

  registerShutdownHandlers(server);

  server.requestTimeout = 30_000;
  server.headersTimeout = 31_000;
  server.keepAliveTimeout = 5_000;

  const address = server.address() as AddressInfo;

  logger.info(
    {
      host: address.address,
      port: address.port,
      path: MCP_ENDPOINT,
      healthPath: HEALTH_ENDPOINT,
      transport: "streamable-http"
    },
    "Streamable HTTP server listening"
  );
}
