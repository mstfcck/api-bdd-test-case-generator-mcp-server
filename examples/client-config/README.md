# Client Config Examples

This folder contains example MCP client configuration files for a local stdio setup of this template.

Replace the placeholder paths before using them.

## Included examples

- `claude-desktop.json`: Claude Desktop local MCP configuration example.
- `vscode.mcp.json`: VS Code `.vscode/mcp.json` or user-profile `mcp.json` example.
- `cline_mcp_settings.json`: Cline configuration example.
- `windsurf.mcp_config.json`: Windsurf `~/.codeium/windsurf/mcp_config.json` example.
- `zed-settings.json`: Zed settings.json example using `context_servers`.

## Expected target locations

- Claude Desktop: Claude Desktop MCP config file.
- VS Code: `.vscode/mcp.json` in a workspace, or the user-profile `mcp.json` opened via `MCP: Open User Configuration`.
- Cline: `cline_mcp_settings.json` from the MCP Servers configuration screen.
- Windsurf: `~/.codeium/windsurf/mcp_config.json`.
- Zed: Zed `settings.json`.

## Path placeholders

- macOS/Linux local build output: `/absolute/path/to/mcp-server-typescript-template/dist/index.js`
- Windows local build output: `C:\\absolute\\path\\to\\mcp-server-typescript-template\\dist\\index.js`

The examples default to `stdio`, which is the safest local starting point for this template.
