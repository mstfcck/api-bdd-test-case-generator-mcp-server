import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testsDir, "..");
const toolScriptPath = path.join(repoRoot, "scripts", "generate-tool.mjs");
const promptScriptPath = path.join(repoRoot, "scripts", "generate-prompt.mjs");
const resourceScriptPath = path.join(
  repoRoot,
  "scripts",
  "generate-resource.mjs"
);

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("generator scripts", () => {
  it("supports dry-run and force for tool scaffolds", () => {
    const workspace = createWorkspace({
      "src/tools/index.ts": "export const toolRegistry = [] as const;\n"
    });

    runScript(toolScriptPath, ["alpha-tool", "--dry-run"], workspace);
    expect(fs.existsSync(path.join(workspace, "src/tools/alpha-tool"))).toBe(
      false
    );
    expect(readWorkspaceFile(workspace, "src/tools/index.ts")).toBe(
      "export const toolRegistry = [] as const;\n"
    );

    runScript(toolScriptPath, ["alpha-tool"], workspace);
    const handlerPath = path.join(workspace, "src/tools/alpha-tool/handler.ts");
    const definitionPath = path.join(
      workspace,
      "src/tools/alpha-tool/definition.ts"
    );
    expect(readWorkspaceFile(workspace, "src/tools/index.ts")).toContain(
      'import { alphaToolDefinition } from "./alpha-tool/definition.js";'
    );
    expect(fs.readFileSync(handlerPath, "utf8")).toContain("alphaToolHandler");
    // Generated handler must be synchronous to match canonical pattern
    expect(fs.readFileSync(handlerPath, "utf8")).not.toContain(
      "async function"
    );
    expect(fs.readFileSync(handlerPath, "utf8")).toContain(
      "alphaToolInputValidator.parse("
    );
    expect(fs.readFileSync(handlerPath, "utf8")).toContain(
      "alphaToolOutputValidator.parse("
    );
    // Generated definition must match canonical pattern: schemas with as const + validators
    const generatedDefinition = fs.readFileSync(definitionPath, "utf8");
    expect(generatedDefinition).toContain("alphaToolInputSchema = {");
    expect(generatedDefinition).toContain("} as const;");
    expect(generatedDefinition).toContain(
      "alphaToolInputValidator = z.object("
    );
    expect(generatedDefinition).toContain(
      "alphaToolOutputValidator = z.object("
    );

    fs.writeFileSync(handlerPath, "sentinel\n");
    runScript(toolScriptPath, ["alpha-tool"], workspace);
    expect(fs.readFileSync(handlerPath, "utf8")).toBe("sentinel\n");

    runScript(toolScriptPath, ["alpha-tool", "--force"], workspace);
    expect(fs.readFileSync(handlerPath, "utf8")).toContain("alphaToolHandler");
    expect(fs.readFileSync(handlerPath, "utf8")).not.toContain("sentinel");
  });

  it("supports dry-run and force for prompt scaffolds", () => {
    const workspace = createWorkspace({
      "src/prompts/generated.ts": [
        'import { zebraPrompt } from "./generated/zebra.js";',
        "",
        "export const generatedPrompts = [",
        "  zebraPrompt",
        "] as const;",
        ""
      ].join("\n")
    });

    runScript(promptScriptPath, ["alpha-prompt", "--dry-run"], workspace);
    expect(
      fs.existsSync(
        path.join(workspace, "src/prompts/generated/alpha-prompt.ts")
      )
    ).toBe(false);

    runScript(promptScriptPath, ["alpha-prompt"], workspace);
    const promptFilePath = path.join(
      workspace,
      "src/prompts/generated/alpha-prompt.ts"
    );
    const registry = readWorkspaceFile(workspace, "src/prompts/generated.ts");

    expect(fs.readFileSync(promptFilePath, "utf8")).toContain("alphaPrompt");
    expect(
      registry.indexOf(
        'import { alphaPrompt } from "./generated/alpha-prompt.js";'
      )
    ).toBeLessThan(
      registry.indexOf('import { zebraPrompt } from "./generated/zebra.js";')
    );

    fs.writeFileSync(promptFilePath, "sentinel\n");
    runScript(promptScriptPath, ["alpha-prompt"], workspace);
    expect(fs.readFileSync(promptFilePath, "utf8")).toBe("sentinel\n");

    runScript(promptScriptPath, ["alpha-prompt", "--force"], workspace);
    expect(fs.readFileSync(promptFilePath, "utf8")).toContain("alphaPrompt");
    expect(fs.readFileSync(promptFilePath, "utf8")).not.toContain("sentinel");
  });

  it("supports dry-run, force, and template mode for resource scaffolds", () => {
    const workspace = createWorkspace();

    runScript(resourceScriptPath, ["api-guide", "--dry-run"], workspace);
    expect(
      fs.existsSync(
        path.join(workspace, "src/resources/generated/api-guide.ts")
      )
    ).toBe(false);
    expect(
      fs.existsSync(path.join(workspace, "src/resources/generated.ts"))
    ).toBe(false);

    runScript(resourceScriptPath, ["api-guide"], workspace);
    const staticFilePath = path.join(
      workspace,
      "src/resources/generated/api-guide.ts"
    );
    expect(fs.readFileSync(staticFilePath, "utf8")).toContain(
      "apiGuideResource"
    );
    expect(
      readWorkspaceFile(workspace, "src/resources/generated.ts")
    ).toContain("generatedStaticResources");

    fs.writeFileSync(staticFilePath, "sentinel\n");
    runScript(resourceScriptPath, ["api-guide"], workspace);
    expect(fs.readFileSync(staticFilePath, "utf8")).toBe("sentinel\n");

    runScript(
      resourceScriptPath,
      ["api-guide", "static", "--force"],
      workspace
    );
    expect(fs.readFileSync(staticFilePath, "utf8")).toContain(
      "apiGuideResource"
    );
    expect(fs.readFileSync(staticFilePath, "utf8")).not.toContain("sentinel");

    runScript(resourceScriptPath, ["project-note", "template"], workspace);
    const templateRegistry = readWorkspaceFile(
      workspace,
      "src/resources/generated.ts"
    );
    expect(templateRegistry).toContain("generatedTemplateResources");
    expect(templateRegistry).toContain("projectNoteResource");
  });
});

function createWorkspace(files: Record<string, string> = {}): string {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "mcp-template-generators-")
  );
  tempDirs.push(workspace);

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(workspace, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }

  return workspace;
}

function readWorkspaceFile(workspace: string, relativePath: string): string {
  return fs.readFileSync(path.join(workspace, relativePath), "utf8");
}

function runScript(scriptPath: string, args: string[], cwd: string): string {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8"
  });
}
