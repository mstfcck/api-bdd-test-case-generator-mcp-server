#!/usr/bin/env node

/**
 * MCP Server entry point for API Spec Test Case Generator
 * Clean Architecture implementation
 */

import 'reflect-metadata';
import { createContainer } from './di/container.js';
import { McpServerAdapter } from './infrastructure/mcp/McpServerAdapter.js';

async function main() {
    try {
        // Create DI container
        const container = createContainer();

        // Create and start MCP server
        const mcpServer = new McpServerAdapter(container);
        await mcpServer.start();

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.error('SIGINT received, shutting down...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.error('SIGTERM received, shutting down...');
            process.exit(0);
        });
    } catch (error) {
        console.error('Fatal error starting MCP server:', error);
        process.exit(1);
    }
}

main();
