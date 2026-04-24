import fs from "node:fs";
import path from "node:path";

const { positionals, dryRun, force } = parseArgs(process.argv.slice(2));
const resourceName = positionals[0];
const resourceMode = positionals[1] ?? "static";

if (!resourceName) {
  console.error(
    "Usage: npm run generate:resource -- <resource-name> [static|template] [--dry-run] [--force]"
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(resourceName)) {
  console.error("Resource name must be kebab-case, for example: api-guide");
  process.exit(1);
}

if (!["static", "template"].includes(resourceMode)) {
  console.error("Resource mode must be either 'static' or 'template'.");
  process.exit(1);
}

const resourceIdentifier = camel(resourceName);
const resourceDir = path.join(process.cwd(), "src", "resources", "generated");
const resourceFilePath = path.join(resourceDir, `${resourceName}.ts`);
const registryPath = path.join(
  process.cwd(),
  "src",
  "resources",
  "generated.ts"
);

const resourceContent =
  resourceMode === "template"
    ? buildTemplateResourceFile(resourceName, resourceIdentifier)
    : buildStaticResourceFile(resourceName, resourceIdentifier);

writeManagedFile(resourceFilePath, resourceContent, { dryRun, force });

const currentRegistry = fs.existsSync(registryPath)
  ? fs.readFileSync(registryPath, "utf8")
  : [
      "export const generatedStaticResources = [] as const;",
      "",
      "export const generatedTemplateResources = [] as const;",
      ""
    ].join("\n");
const nextRegistry = updateResourceRegistry(
  currentRegistry,
  resourceName,
  resourceIdentifier,
  resourceMode
);

if (nextRegistry !== currentRegistry) {
  writeManagedFile(registryPath, nextRegistry, { dryRun, force: true });
}

console.log(
  `${dryRun ? "Resource scaffold previewed" : "Resource scaffold ensured"} at ${resourceFilePath}`
);
console.log(
  `${dryRun ? "Resource registry previewed" : "Resource registry updated"} in ${registryPath}`
);

function camel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function toTitle(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildStaticResourceFile(name, identifier) {
  return `export const ${identifier}Resource = {
  uri: "resource://generated/${name}",
  name: "${name.replace(/-/g, "_")}",
  title: "${toTitle(name)}",
  description: "Describe the read-only context returned by this resource.",
  mimeType: "application/json",
  text: JSON.stringify(
    {
      name: "${name}",
      summary: "Replace this placeholder payload with real resource content."
    },
    null,
    2
  )
} as const;
`;
}

function buildTemplateResourceFile(name, identifier) {
  return `import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const ${identifier}ResourceParamSchema = z.string().min(1);

export const ${identifier}Resource = {
  name: "${name.replace(/-/g, "_")}",
  title: "${toTitle(name)}",
  description: "Describe the parameterized resource returned by this template.",
  template: new ResourceTemplate("resource://generated/${name}/{id}", {
    list: undefined
  }),
  mimeType: "application/json",
  read: async (uri, params) => {
    const id = ${identifier}ResourceParamSchema.parse(params.id);

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              id,
              summary: "Replace this placeholder payload with real template resource content."
            },
            null,
            2
          )
        }
      ]
    };
  }
} as const;
`;
}

function updateResourceRegistry(source, name, identifier, mode) {
  const importLine = `import { ${identifier}Resource } from "./generated/${name}.js";`;
  const importLines = [...source.matchAll(/^import .*;$/gm)].map(
    (match) => match[0]
  );
  const nextImports = [...new Set([...importLines, importLine])].sort(
    (left, right) => left.localeCompare(right)
  );
  const staticEntries = getEntries(source, "generatedStaticResources");
  const templateEntries = getEntries(source, "generatedTemplateResources");

  if (mode === "template") {
    templateEntries.push(`${identifier}Resource`);
  } else {
    staticEntries.push(`${identifier}Resource`);
  }

  const importsBlock =
    nextImports.length > 0 ? `${nextImports.join("\n")}\n\n` : "";

  return [
    importsBlock,
    buildRegistryBlock("generatedStaticResources", staticEntries),
    "",
    buildRegistryBlock("generatedTemplateResources", templateEntries),
    ""
  ].join("\n");
}

function getEntries(source, exportName) {
  const match = source.match(
    new RegExp(
      `export const ${exportName} = \\[(?<entries>[\\s\\S]*?)\\] as const;`
    )
  );

  return match?.groups?.entries
    ? [
        ...new Set(
          match.groups.entries
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
        )
      ].sort((left, right) => left.localeCompare(right))
    : [];
}

function buildRegistryBlock(exportName, entries) {
  const uniqueEntries = [...new Set(entries)].sort((left, right) =>
    left.localeCompare(right)
  );

  if (uniqueEntries.length === 0) {
    return `export const ${exportName} = [] as const;`;
  }

  return `export const ${exportName} = [\n  ${uniqueEntries.join(",\n  ")}\n] as const;`;
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
