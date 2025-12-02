import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { Container } from 'inversify';
import { TYPES } from '../../di/types.js';
import {
    LoadSpecificationUseCase,
    ListEndpointsUseCase,
    AnalyzeEndpointUseCase,
    GenerateScenariosUseCase,
    ExportFeatureUseCase
} from '../../application/use-cases/index.js';
import { RequestValidator } from './RequestValidator.js';
import { Logger } from '../../shared/index.js';

export class McpServerAdapter {
    private server: Server;
    private container: Container;
    private logger: Logger;

    constructor(container: Container) {
        this.container = container;
        this.logger = container.get<Logger>(TYPES.Logger);
        this.server = new Server(
            {
                name: 'api-bdd-test-case-generator',
                version: '0.1.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.registerHandlers();
    }

    private registerHandlers(): void {
        // List tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'load_spec',
                    description: 'Load and validate an OpenAPI specification',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            filePath: { type: 'string', description: 'Path to the OpenAPI spec file' },
                            content: { type: 'string', description: 'OpenAPI spec content as string' },
                            format: { type: 'string', enum: ['yaml', 'json'], description: 'Format of the content' }
                        }
                    }
                },
                {
                    name: 'list_endpoints',
                    description: 'List all endpoints in the loaded specification',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            filter: {
                                type: 'object',
                                properties: {
                                    method: { type: 'string' },
                                    tag: { type: 'string' },
                                    path: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                {
                    name: 'analyze_endpoint',
                    description: 'Analyze a specific endpoint',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Endpoint path' },
                            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], description: 'HTTP method' }
                        },
                        required: ['path', 'method']
                    }
                },
                {
                    name: 'generate_scenarios',
                    description: 'Generate test scenarios for the analyzed endpoint',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            scenarioTypes: { type: 'array', items: { type: 'string' } },
                            includeBackground: { type: 'boolean' }
                        }
                    }
                },
                {
                    name: 'export_feature',
                    description: 'Export generated scenarios to a feature file',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            format: { type: 'string', enum: ['gherkin', 'json', 'markdown'], default: 'gherkin' },
                            outputPath: { type: 'string' },
                            includeComments: { type: 'boolean', default: true }
                        }
                    }
                }
            ]
        }));

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            this.logger.info('Tool called', { tool: name });

            try {
                let result;

                switch (name) {
                    case 'load_spec':
                        result = await this.handleLoadSpec(args);
                        break;
                    case 'list_endpoints':
                        result = await this.handleListEndpoints(args);
                        break;
                    case 'analyze_endpoint':
                        result = await this.handleAnalyzeEndpoint(args);
                        break;
                    case 'generate_scenarios':
                        result = await this.handleGenerateScenarios(args);
                        break;
                    case 'export_feature':
                        result = await this.handleExportFeature(args);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            } catch (error) {
                this.logger.error('Tool execution failed', error as Error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: (error as Error).message
                            }, null, 2)
                        }
                    ],
                    isError: true
                };
            }
        });
    }

    private async handleLoadSpec(args: unknown) {
        const validator = this.container.get<RequestValidator>(TYPES.RequestValidator);
        const validatedArgs = validator.validateLoadSpec(args);
        const useCase = this.container.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);
        return await useCase.execute(validatedArgs);
    }

    private async handleListEndpoints(args: unknown) {
        const validator = this.container.get<RequestValidator>(TYPES.RequestValidator);
        const validatedArgs = validator.validateListEndpoints(args || {});
        const useCase = this.container.get<ListEndpointsUseCase>(TYPES.ListEndpointsUseCase);
        return await useCase.execute(validatedArgs);
    }

    private async handleAnalyzeEndpoint(args: unknown) {
        const validator = this.container.get<RequestValidator>(TYPES.RequestValidator);
        const validatedArgs = validator.validateAnalyzeEndpoint(args);
        const useCase = this.container.get<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase);
        return await useCase.execute(validatedArgs);
    }

    private async handleGenerateScenarios(args: unknown) {
        const validator = this.container.get<RequestValidator>(TYPES.RequestValidator);
        const validatedArgs = validator.validateGenerateScenarios(args || {});
        const useCase = this.container.get<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase);
        return await useCase.execute(validatedArgs);
    }

    private async handleExportFeature(args: unknown) {
        const validator = this.container.get<RequestValidator>(TYPES.RequestValidator);
        const validatedArgs = validator.validateExportFeature(args || {});
        const useCase = this.container.get<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase);
        return await useCase.execute(validatedArgs);
    }

    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('MCP Server started successfully');
    }
}
