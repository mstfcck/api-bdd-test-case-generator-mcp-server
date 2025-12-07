import 'reflect-metadata';
import { Container } from 'inversify';
import { McpServerAdapter } from '../../../src/infrastructure/mcp/McpServerAdapter';
import { TYPES } from '../../../src/di/types';
import { Logger } from '../../../src/shared/logging/Logger';
import { RequestValidator } from '../../../src/infrastructure/mcp/RequestValidator';
import {
    LoadSpecificationUseCase,
    ListEndpointsUseCase,
    AnalyzeEndpointUseCase,
    GenerateScenariosUseCase,
    ExportFeatureUseCase
} from '../../../src/application/use-cases';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock the SDK Server
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
    return {
        Server: jest.fn().mockImplementation(() => ({
            setRequestHandler: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined)
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
    let container: Container;
    let adapter: McpServerAdapter;
    let mockLogger: jest.Mocked<Logger>;
    let mockValidator: jest.Mocked<RequestValidator>;
    let mockLoadSpec: jest.Mocked<LoadSpecificationUseCase>;
    let mockListEndpoints: jest.Mocked<ListEndpointsUseCase>;
    let mockAnalyzeEndpoint: jest.Mocked<AnalyzeEndpointUseCase>;
    let mockGenerateScenarios: jest.Mocked<GenerateScenariosUseCase>;
    let mockExportFeature: jest.Mocked<ExportFeatureUseCase>;
    let mockServer: any;

    beforeEach(() => {
        container = new Container();

        // Setup mocks
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        } as any;

        mockValidator = {
            validateLoadSpec: jest.fn(),
            validateListEndpoints: jest.fn(),
            validateAnalyzeEndpoint: jest.fn(),
            validateGenerateScenarios: jest.fn(),
            validateExportFeature: jest.fn()
        } as any;

        mockLoadSpec = { execute: jest.fn() } as any;
        mockListEndpoints = { execute: jest.fn() } as any;
        mockAnalyzeEndpoint = { execute: jest.fn() } as any;
        mockGenerateScenarios = { execute: jest.fn() } as any;
        mockExportFeature = { execute: jest.fn() } as any;

        // Bind mocks to container
        container.bind(TYPES.Logger).toConstantValue(mockLogger);
        container.bind(TYPES.RequestValidator).toConstantValue(mockValidator);
        container.bind(TYPES.LoadSpecificationUseCase).toConstantValue(mockLoadSpec);
        container.bind(TYPES.ListEndpointsUseCase).toConstantValue(mockListEndpoints);
        container.bind(TYPES.AnalyzeEndpointUseCase).toConstantValue(mockAnalyzeEndpoint);
        container.bind(TYPES.GenerateScenariosUseCase).toConstantValue(mockGenerateScenarios);
        container.bind(TYPES.ExportFeatureUseCase).toConstantValue(mockExportFeature);

        // Clear mock calls
        (Server as unknown as jest.Mock).mockClear();

        adapter = new McpServerAdapter(container);
        mockServer = (adapter as any).server;
    });

    it('should initialize server and register handlers', () => {
        expect(Server).toHaveBeenCalledWith(
            { name: 'api-bdd-test-case-generator', version: '0.1.0' },
            { capabilities: { tools: {} } }
        );
        expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
        expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ListToolsRequestSchema, expect.any(Function));
        expect(mockServer.setRequestHandler).toHaveBeenCalledWith(CallToolRequestSchema, expect.any(Function));
    });

    it('should start the server', async () => {
        await adapter.start();
        expect(mockServer.connect).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('MCP Server started successfully');
    });

    describe('Tool Handlers', () => {
        let callToolHandler: (request: any) => Promise<any>;

        beforeEach(() => {
            // Extract the handler registered for CallToolRequestSchema
            const calls = mockServer.setRequestHandler.mock.calls;
            const callToolCall = calls.find((call: any) => call[0] === CallToolRequestSchema);
            callToolHandler = callToolCall[1];
        });

        it('should handle load_spec tool', async () => {
            const args = { filePath: 'test.yaml' };
            const expectedResult = { success: true };

            mockValidator.validateLoadSpec.mockReturnValue(args as any);
            mockLoadSpec.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'load_spec', arguments: args }
            });

            expect(mockValidator.validateLoadSpec).toHaveBeenCalledWith(args);
            expect(mockLoadSpec.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle list_endpoints tool', async () => {
            const args = { filter: { method: 'GET' } };
            const expectedResult = { endpoints: [] };

            mockValidator.validateListEndpoints.mockReturnValue(args as any);
            mockListEndpoints.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'list_endpoints', arguments: args }
            });

            expect(mockValidator.validateListEndpoints).toHaveBeenCalledWith(args);
            expect(mockListEndpoints.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle list_endpoints tool with missing args', async () => {
            const expectedResult = { endpoints: [] };

            mockValidator.validateListEndpoints.mockReturnValue({} as any);
            mockListEndpoints.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'list_endpoints' }
            });

            expect(mockValidator.validateListEndpoints).toHaveBeenCalledWith({});
            expect(mockListEndpoints.execute).toHaveBeenCalledWith({});
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle analyze_endpoint tool', async () => {
            const args = { path: '/test', method: 'GET' };
            const expectedResult = { analysis: {} };

            mockValidator.validateAnalyzeEndpoint.mockReturnValue(args as any);
            mockAnalyzeEndpoint.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'analyze_endpoint', arguments: args }
            });

            expect(mockValidator.validateAnalyzeEndpoint).toHaveBeenCalledWith(args);
            expect(mockAnalyzeEndpoint.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle generate_scenarios tool', async () => {
            const args = { scenarioTypes: ['required_fields'] };
            const expectedResult = { scenarios: [] };

            mockValidator.validateGenerateScenarios.mockReturnValue(args as any);
            mockGenerateScenarios.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'generate_scenarios', arguments: args }
            });

            expect(mockValidator.validateGenerateScenarios).toHaveBeenCalledWith(args);
            expect(mockGenerateScenarios.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle generate_scenarios tool with missing args', async () => {
            const expectedResult = { scenarios: [] };

            mockValidator.validateGenerateScenarios.mockReturnValue({} as any);
            mockGenerateScenarios.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'generate_scenarios' }
            });

            expect(mockValidator.validateGenerateScenarios).toHaveBeenCalledWith({});
            expect(mockGenerateScenarios.execute).toHaveBeenCalledWith({});
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle export_feature tool', async () => {
            const args = { format: 'gherkin' };
            const expectedResult = { content: 'Feature: ...' };

            mockValidator.validateExportFeature.mockReturnValue(args as any);
            mockExportFeature.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'export_feature', arguments: args }
            });

            expect(mockValidator.validateExportFeature).toHaveBeenCalledWith(args);
            expect(mockExportFeature.execute).toHaveBeenCalledWith(args);
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle export_feature tool with missing args', async () => {
            const expectedResult = { content: 'Feature: ...' };

            mockValidator.validateExportFeature.mockReturnValue({} as any);
            mockExportFeature.execute.mockResolvedValue(expectedResult as any);

            const response = await callToolHandler({
                params: { name: 'export_feature' }
            });

            expect(mockValidator.validateExportFeature).toHaveBeenCalledWith({});
            expect(mockExportFeature.execute).toHaveBeenCalledWith({});
            expect(response).toEqual({
                content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }]
            });
        });

        it('should handle unknown tool', async () => {
            const response = await callToolHandler({
                params: { name: 'unknown_tool', arguments: {} }
            });

            expect(response).toEqual({
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Unknown tool: unknown_tool'
                    }, null, 2)
                }],
                isError: true
            });
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should handle execution errors', async () => {
            const error = new Error('Execution failed');
            mockValidator.validateLoadSpec.mockImplementation(() => { throw error; });

            const response = await callToolHandler({
                params: { name: 'load_spec', arguments: {} }
            });

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

    describe('List Tools Handler', () => {
        let listToolsHandler: () => Promise<any>;

        beforeEach(() => {
            const calls = mockServer.setRequestHandler.mock.calls;
            const listToolsCall = calls.find((call: any) => call[0] === ListToolsRequestSchema);
            listToolsHandler = listToolsCall[1];
        });

        it('should return list of available tools', async () => {
            const response = await listToolsHandler();
            expect(response.tools).toHaveLength(5);
            expect(response.tools.map((t: any) => t.name)).toEqual([
                'load_spec',
                'list_endpoints',
                'analyze_endpoint',
                'generate_scenarios',
                'export_feature'
            ]);
        });
    });
});
