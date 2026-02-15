import 'reflect-metadata';
import { McpServerAdapter } from '../../../src/infrastructure/mcp/McpServerAdapter';
import {
    LoadSpecificationUseCase,
    ListEndpointsUseCase,
    AnalyzeEndpointUseCase,
    GenerateScenariosUseCase,
    ExportFeatureUseCase
} from '../../../src/application/use-cases';
import type { ILogger } from '../../../src/shared/logging/ILogger';

// Capture registered tools
const registeredTools: Array<{ name: string; config: any; handler: Function }> = [];
const mockConnect = jest.fn().mockResolvedValue(undefined);

// Mock McpServer
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
    return {
        McpServer: jest.fn().mockImplementation(() => ({
            registerTool: jest.fn((name: string, config: any, handler: Function) => {
                registeredTools.push({ name, config, handler });
            }),
            connect: mockConnect
        }))
    };
});

// Mock StdioServerTransport
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
    return {
        StdioServerTransport: jest.fn().mockImplementation(() => ({}))
    };
});

describe('McpServerAdapter', () => {
    let adapter: McpServerAdapter;
    let mockLogger: jest.Mocked<ILogger>;
    let mockLoadSpec: jest.Mocked<LoadSpecificationUseCase>;
    let mockListEndpoints: jest.Mocked<ListEndpointsUseCase>;
    let mockAnalyzeEndpoint: jest.Mocked<AnalyzeEndpointUseCase>;
    let mockGenerateScenarios: jest.Mocked<GenerateScenariosUseCase>;
    let mockExportFeature: jest.Mocked<ExportFeatureUseCase>;

    beforeEach(() => {
        registeredTools.length = 0;
        mockConnect.mockClear();

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn(),
            child: jest.fn()
        } as any;

        mockLoadSpec = { execute: jest.fn() } as any;
        mockListEndpoints = { execute: jest.fn() } as any;
        mockAnalyzeEndpoint = { execute: jest.fn() } as any;
        mockGenerateScenarios = { execute: jest.fn() } as any;
        mockExportFeature = { execute: jest.fn() } as any;

        adapter = new McpServerAdapter(
            mockLoadSpec,
            mockListEndpoints,
            mockAnalyzeEndpoint,
            mockGenerateScenarios,
            mockExportFeature,
            mockLogger
        );
    });

    it('should register all 5 tools on construction', () => {
        expect(registeredTools).toHaveLength(5);
        expect(registeredTools.map(t => t.name)).toEqual([
            'load_spec',
            'list_endpoints',
            'analyze_endpoint',
            'generate_scenarios',
            'export_feature'
        ]);

        // Verify config object structure (title + description + inputSchema)
        for (const tool of registeredTools) {
            expect(tool.config).toHaveProperty('description');
            expect(tool.config).toHaveProperty('title');
            expect(tool.config).toHaveProperty('inputSchema');
        }
    });

    it('should start the server by connecting transport', async () => {
        await adapter.start();
        expect(mockConnect).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('MCP Server started successfully');
    });

    describe('Tool Handlers', () => {
        function getToolHandler(name: string): Function {
            const tool = registeredTools.find(t => t.name === name);
            if (!tool) throw new Error(`Tool ${name} not found`);
            return tool.handler;
        }

        it('should handle load_spec tool', async () => {
            const args = { filePath: 'test.yaml' };
            const expectedResult = { success: true };
            mockLoadSpec.execute.mockResolvedValue(expectedResult as any);

            const handler = getToolHandler('load_spec');
            const response = await handler(args);

            expect(mockLoadSpec.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle list_endpoints tool', async () => {
            const args = { filter: { method: 'GET' } };
            const expectedResult = { endpoints: [] };
            mockListEndpoints.execute.mockResolvedValue(expectedResult as any);

            const handler = getToolHandler('list_endpoints');
            const response = await handler(args);

            expect(mockListEndpoints.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle analyze_endpoint tool', async () => {
            const args = { path: '/test', method: 'GET' };
            const expectedResult = { analysis: {} };
            mockAnalyzeEndpoint.execute.mockResolvedValue(expectedResult as any);

            const handler = getToolHandler('analyze_endpoint');
            const response = await handler(args);

            expect(mockAnalyzeEndpoint.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle generate_scenarios tool', async () => {
            const args = { scenarioTypes: ['required_fields'] };
            const expectedResult = { scenarios: [] };
            mockGenerateScenarios.execute.mockResolvedValue(expectedResult as any);

            const handler = getToolHandler('generate_scenarios');
            const response = await handler(args);

            expect(mockGenerateScenarios.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle export_feature tool', async () => {
            const args = { format: 'gherkin' };
            const expectedResult = { content: 'Feature: ...' };
            mockExportFeature.execute.mockResolvedValue(expectedResult as any);

            const handler = getToolHandler('export_feature');
            const response = await handler(args);

            expect(mockExportFeature.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle execution errors', async () => {
            const error = new Error('Execution failed');
            mockLoadSpec.execute.mockRejectedValue(error);

            const handler = getToolHandler('load_spec');
            const response = await handler({ filePath: 'test.yaml' });

            expect(response).toEqual({
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Execution failed'
                    }, null, 2)
                }],
                isError: true
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Tool execution failed', error);
        });
    });
});
