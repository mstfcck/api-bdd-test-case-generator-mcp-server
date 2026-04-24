import fs from "node:fs";
import path from "node:path";

const { positionals, dryRun, force } = parseArgs(process.argv.slice(2));
const promptName = positionals[0];

if (!promptName) {
  console.error(
    "Usage: npm run generate:prompt -- <prompt-name> [--dry-run] [--force]"
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(promptName)) {
  console.error("Prompt name must be kebab-case, for example: summarize-docs");
  process.exit(1);
}

const promptIdentifier = camel(promptName);
const promptDir = path.join(process.cwd(), "src", "prompts", "generated");
const promptFilePath = path.join(promptDir, `${promptName}.ts`);
const registryPath = path.join(process.cwd(), "src", "prompts", "generated.ts");

const promptContent = `import { z } from "zod";

export const ${promptIdentifier}PromptArgsSchema = {
  subject: z.string().min(1).describe("Primary subject for the ${promptName} prompt.")
};

type ${promptIdentifier}PromptArgs = {
  subject: string;
};

export const ${promptIdentifier}Prompt = {
  name: "${promptName}",
  title: "${toTitle(promptName)}",
  description: "Describe the reusable workflow that this prompt should drive.",
  argsSchema: ${promptIdentifier}PromptArgsSchema,
  messages: ({ subject }: ${promptIdentifier}PromptArgs) => [
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text: [
          "Replace this placeholder content with a reusable workflow prompt.",
          "Subject: " + subject
        ].join("\\n")
      }
    }
  ]
} as const;
  `;

writeManagedFile(promptFilePath, promptContent, { dryRun, force });

const currentRegistry = fs.existsSync(registryPath)
  ? fs.readFileSync(registryPath, "utf8")
  : "export const generatedPrompts = [] as const;\n";
const nextRegistry = updatePromptRegistry(
  currentRegistry,
  promptName,
  promptIdentifier
);

if (nextRegistry !== currentRegistry) {
  writeManagedFile(registryPath, nextRegistry, { dryRun, force: true });
}

console.log(
  `${dryRun ? "Prompt scaffold previewed" : "Prompt scaffold ensured"} at ${promptFilePath}`
);
console.log(
  `${dryRun ? "Prompt registry previewed" : "Prompt registry updated"} in ${registryPath}`
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

function updatePromptRegistry(source, name, identifier) {
  const importLine = `import { ${identifier}Prompt } from "./generated/${name}.js";`;
  const entryLine = `${identifier}Prompt`;
  const importLines = [...source.matchAll(/^import .*;$/gm)].map(
    (match) => match[0]
  );
  const nextImports = [...new Set([...importLines, importLine])].sort(
    (left, right) => left.localeCompare(right)
  );
  const entryMatch = source.match(
    /export const generatedPrompts = \[(?<entries>[\s\S]*?)\] as const;/
  );
  const existingEntries = entryMatch?.groups?.entries
    ? entryMatch.groups.entries
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  const nextEntries = [...new Set([...existingEntries, entryLine])].sort(
    (left, right) => left.localeCompare(right)
  );

  const importsBlock =
    nextImports.length > 0 ? `${nextImports.join("\n")}\n\n` : "";
  const entriesBlock =
    nextEntries.length > 0
      ? `export const generatedPrompts = [\n  ${nextEntries.join(",\n  ")}\n] as const;\n`
      : "export const generatedPrompts = [] as const;\n";

  return `${importsBlock}${entriesBlock}`;
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
