import fs from "node:fs";
import path from "node:path";

const { positionals, dryRun, force } = parseArgs(process.argv.slice(2));
const toolName = positionals[0];

if (!toolName) {
  console.error(
    "Usage: npm run generate:tool -- <tool-name> [--dry-run] [--force]"
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(toolName)) {
  console.error("Tool name must be kebab-case, for example: search-docs");
  process.exit(1);
}

const toolIdentifier = toToolSymbolStem(toolName);

const baseDir = path.join(process.cwd(), "src", "tools", toolName);
const registryPath = path.join(process.cwd(), "src", "tools", "index.ts");

const definitionPath = path.join(baseDir, "definition.ts");
const handlerPath = path.join(baseDir, "handler.ts");
const registryExists = fs.existsSync(registryPath);

const definitionContent = `import { z } from "zod";

export const ${toolIdentifier}ToolInputSchema = {
  input: z.string().min(1).describe("Primary input for the ${toolName} tool.")
} as const;

export const ${toolIdentifier}ToolInputValidator = z.object(${toolIdentifier}ToolInputSchema);

export const ${toolIdentifier}ToolOutputSchema = {
  result: z.string().describe("Structured result returned by the ${toolName} tool.")
} as const;

export const ${toolIdentifier}ToolOutputValidator = z.object(${toolIdentifier}ToolOutputSchema);

export const ${toolIdentifier}ToolDefinition = {
  name: "${toolName}",
  title: "${toTitle(toolName)}",
  description: "Describe what the ${toolName} tool does and when it should be used.",
  inputSchema: ${toolIdentifier}ToolInputSchema,
  outputSchema: ${toolIdentifier}ToolOutputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
} as const;
`;

const handlerContent = `import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";
import {
  ${toolIdentifier}ToolInputValidator,
  ${toolIdentifier}ToolOutputValidator
} from "./definition.js";

export function ${toolIdentifier}ToolHandler(input: unknown): ToolResponse {
  const { input: value } = ${toolIdentifier}ToolInputValidator.parse(input);
  const output = ${toolIdentifier}ToolOutputValidator.parse({ result: value });
  return jsonResponse(output);
}
`;

writeManagedFile(definitionPath, definitionContent, { dryRun, force });
writeManagedFile(handlerPath, handlerContent, { dryRun, force });

if (registryExists) {
  const currentRegistry = fs.readFileSync(registryPath, "utf8");
  const nextRegistry = updateRegistryFile(
    currentRegistry,
    toolName,
    toolIdentifier
  );

  if (nextRegistry !== currentRegistry) {
    writeManagedFile(registryPath, nextRegistry, { dryRun, force: true });
  }
}

console.log(
  `${dryRun ? "Tool scaffold previewed" : "Tool scaffold ensured"} at ${baseDir}`
);
if (registryExists) {
  console.log(
    `${dryRun ? "Tool registry previewed" : "Tool registry updated"} in ${registryPath}`
  );
}

function camel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function toToolSymbolStem(value) {
  const withoutSuffix = value.endsWith("-tool") ? value.slice(0, -5) : value;

  return camel(withoutSuffix || value);
}

function toTitle(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function updateRegistryFile(source, name, identifier) {
  const definitionImport = `import { ${identifier}ToolDefinition } from "./${name}/definition.js";`;
  const handlerImport = `import { ${identifier}ToolHandler } from "./${name}/handler.js";`;
  const registryEntry = `  {\n    definition: ${identifier}ToolDefinition,\n    handler: ${identifier}ToolHandler\n  }`;

  const importLines = [...source.matchAll(/^import .*;$/gm)].map(
    (match) => match[0]
  );
  const nextImports = [
    ...new Set([...importLines, definitionImport, handlerImport])
  ].sort((left, right) => left.localeCompare(right));
  const registryMatch = source.match(
    /export const toolRegistry = \[(?<entries>[\s\S]*?)\] as const;/
  );
  const existingEntries = registryMatch?.groups?.entries
    ? [...registryMatch.groups.entries.matchAll(/\{[\s\S]*?\}/g)].map((match) =>
        match[0].trim()
      )
    : [];
  const nextEntries = [...new Set([...existingEntries, registryEntry])].sort(
    (left, right) => left.localeCompare(right)
  );

  return [
    nextImports.join("\n"),
    "",
    "export const toolRegistry = [",
    nextEntries.join(",\n"),
    "] as const;",
    ""
  ].join("\n");
}

function parseArgs(args) {
  const flags = new Set();
  const positionals = [];

  for (const arg of args) {
    if (arg === "--dry-run" || arg === "--force") {
      flags.add(arg);
      continue;
    }

    if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }

    positionals.push(arg);
  }

  return {
    positionals,
    dryRun: flags.has("--dry-run"),
    force: flags.has("--force")
  };
}

function writeManagedFile(filePath, content, options) {
  const exists = fs.existsSync(filePath);

  if (exists && !options.force) {
    console.log(`Skipped existing file: ${filePath}`);
    return;
  }

  if (options.dryRun) {
    console.log(`${exists ? "Would overwrite" : "Would create"} ${filePath}`);
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}
