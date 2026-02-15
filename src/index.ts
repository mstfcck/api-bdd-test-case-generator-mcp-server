#!/usr/bin/env node

/**
 * MCP Server entry point for API Spec Test Case Generator
 * Clean Architecture implementation with Inversify DI
 */

import 'reflect-metadata';
import { createContainer } from './di/container.js';
import { McpServerAdapter } from './infrastructure/mcp/McpServerAdapter.js';

async function main() {
    try {
        const container = createContainer();
        const mcpServer = container.get(McpServerAdapter);
        await mcpServer.start();

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
