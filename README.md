# mcp-server-typescript-template

A production-oriented TypeScript template for building MCP servers on the stable
`@modelcontextprotocol/sdk` line.

## Features

- Real stdio transport
- Real Streamable HTTP endpoint at `/mcp`
- Dedicated health endpoint at `/healthz`
- Strict TypeScript + NodeNext
- Example tools with validation, structured output, and tool annotations
- Example resources and prompts
- ESLint + Prettier + markdownlint + Vitest + Husky + Changesets
- GitHub Actions CI + security scanning + release automation

## Requirements

- Node.js 22+

## Transports

- `stdio`: best for local clients that spawn the server as a subprocess.
- `streamable-http`: best for remote deployments and MCP clients connecting over HTTP.

The HTTP server binds to `127.0.0.1` by default to reduce DNS rebinding risk during local development.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

To start the HTTP transport instead of stdio:

```bash
MCP_TRANSPORT=streamable-http npm run dev
```

The Streamable HTTP endpoint is exposed at `http://127.0.0.1:3000/mcp` by default.
The health endpoint is exposed at `http://127.0.0.1:3000/healthz` when HTTP transport is enabled.

Client configuration examples for Claude Desktop, VS Code, Cline, Windsurf, and Zed are available in `examples/client-config`.

## Build

```bash
npm run build
npm start
```

The provided Docker image defaults to `streamable-http`, binds to `0.0.0.0`, and exposes port `3000`.

## Test

```bash
npm test
```

Run the full quality gate with:

```bash
npm run check
```

## Template structure

- `src/server`: MCP server creation, feature registration, and transports
- `src/tools`: example tools split into `definition.ts` and `handler.ts`
- `src/resources`: static and parameterized resource examples
- `src/prompts`: reusable parameterized prompt examples
- `src/lib`: shared helpers for responses, errors, and handler wrapping

## Adding a tool

1. Run `npm run generate:tool -- my-new-tool`.
2. The generator scaffolds `definition.ts` and `handler.ts`, then updates `src/tools/index.ts` automatically in alphabetical order.
3. Refine the generated schemas, description, and annotations for the real use case.

Use `--dry-run` to preview file changes without writing them, and `--force` to overwrite an existing scaffold file.

The template wraps tool handlers automatically so thrown validation or runtime errors become MCP tool errors with `isError: true`.

## HTTP hardening

- `MCP_ALLOWED_HOSTS`: comma-separated host allowlist for non-localhost HTTP bindings.
- `TRUST_PROXY_HOPS`: number of trusted reverse-proxy hops before reading forwarded headers.
- `MCP_RATE_LIMIT_WINDOW_MS`: rate-limit window in milliseconds.
- `MCP_RATE_LIMIT_MAX`: max requests per IP in a rate-limit window.
- `MCP_SHUTDOWN_GRACE_MS`: forced shutdown timeout during SIGINT/SIGTERM handling.

For internet-facing deployments, set `HOST=0.0.0.0`, define `MCP_ALLOWED_HOSTS`, terminate TLS at a trusted proxy, and set `TRUST_PROXY_HOPS` to match that proxy chain.

## Release automation

- CI runs `npm run check` on pushes and pull requests.
- The security workflow runs production `npm audit` and CodeQL analysis.
- The release workflow uses Changesets only to open and update version PRs.

## Adding prompts and resources

- Run `npm run generate:prompt -- my-new-prompt` to scaffold a parameterized prompt and auto-register it.
- Run `npm run generate:resource -- my-new-resource` to scaffold a static resource and auto-register it.
- Run `npm run generate:resource -- my-new-template template` to scaffold a parameterized resource template.
- The same `--dry-run` and `--force` options are supported for prompt and resource generators.

## Example prompts and resources

- Prompt example: `draft_tool_spec` turns a user goal into a first-pass MCP tool contract.
- Resource example: `resource://server/guides/{topic}` returns focused guidance for `tools`, `resources`, `prompts`, or `transports`.

## Available example tools

- echo
- health_check
- server_info
- current_time

## Best-practice defaults

- Keep stdio support for local MCP clients.
- Use Streamable HTTP for remote access.
- Return both `content` and `structuredContent` when a tool has structured output.
- Use tool annotations to communicate side effects and idempotency.
- Prefer localhost binding unless you intentionally deploy behind authentication and host validation.
