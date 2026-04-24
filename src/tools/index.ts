import { currentTimeToolDefinition } from "./current-time/definition.js";
import { currentTimeToolHandler } from "./current-time/handler.js";
import { echoToolDefinition } from "./echo/definition.js";
import { echoToolHandler } from "./echo/handler.js";
import { healthCheckToolDefinition } from "./health-check/definition.js";
import { healthCheckToolHandler } from "./health-check/handler.js";
import { serverInfoToolDefinition } from "./server-info/definition.js";
import { serverInfoToolHandler } from "./server-info/handler.js";

export const toolRegistry = [
  {
    definition: echoToolDefinition,
    handler: echoToolHandler
  },
  {
    definition: healthCheckToolDefinition,
    handler: healthCheckToolHandler
  },
  {
    definition: serverInfoToolDefinition,
    handler: serverInfoToolHandler
  },
  {
    definition: currentTimeToolDefinition,
    handler: currentTimeToolHandler
  }
] as const;
