import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { injectable, inject } from 'inversify';
import { z } from 'zod';
import { TYPES } from '../../di/types.js';
import {
    LoadSpecificationUseCase,
    ListEndpointsUseCase,
    AnalyzeEndpointUseCase,
    GenerateScenariosUseCase,
    ExportFeatureUseCase
} from '../../application/use-cases/index.js';
import type { ILogger } from '../../shared/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';

/**
 * MCP Server Adapter
 *
 * Uses McpServer.registerTool() (SDK 1.26+) with config objects
 * and Zod schemas for input validation — no duplicate JSON Schemas needed.
 * All dependencies are constructor-injected via Inversify.
 */
@injectable()
export class McpServerAdapter {
    private readonly server: McpServer;

    constructor(
        @inject(TYPES.LoadSpecificationUseCase) private readonly loadSpecUseCase: LoadSpecificationUseCase,
        @inject(TYPES.ListEndpointsUseCase) private readonly listEndpointsUseCase: ListEndpointsUseCase,
        @inject(TYPES.AnalyzeEndpointUseCase) private readonly analyzeEndpointUseCase: AnalyzeEndpointUseCase,
        @inject(TYPES.GenerateScenariosUseCase) private readonly generateScenariosUseCase: GenerateScenariosUseCase,
        @inject(TYPES.ExportFeatureUseCase) private readonly exportFeatureUseCase: ExportFeatureUseCase,
        @inject(TYPES.ILogger) private readonly logger: ILogger
    ) {
        this.server = new McpServer({
            name: 'api-bdd-test-case-generator',
            version: '0.1.0'
        });

        this.registerTools();
    }

    private registerTools(): void {
        this.registerLoadSpec();
        this.registerListEndpoints();
        this.registerAnalyzeEndpoint();
        this.registerGenerateScenarios();
        this.registerExportFeature();
    }

    private registerLoadSpec(): void {
        this.server.registerTool(
            'load_spec',
            {
                title: 'Load Specification',
                description: 'Load and validate an OpenAPI specification from a file path or inline content',
                inputSchema: {
                    filePath: z.string().optional().describe('Path to the OpenAPI spec file'),
                    content: z.string().optional().describe('OpenAPI spec content as string'),
                    format: z.enum(['yaml', 'json']).optional().describe('Format of the content')
                }
            },
            async (args) => {
                this.logger.info('Tool called', { tool: 'load_spec' });
                try {
                    const result = await this.loadSpecUseCase.execute(args);
                    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
                } catch (error) {
                    return this.errorResponse(error);
                }
            }
        );
    }

    private registerListEndpoints(): void {
        this.server.registerTool(
            'list_endpoints',
            {
                title: 'List Endpoints',
                description: 'List all endpoints in the loaded specification',
                inputSchema: {
                    filter: z.object({
                        method: z.string().optional(),
                        tag: z.string().optional(),
                        path: z.string().optional()
                    }).optional().describe('Optional filters for endpoints')
                }
            },
            async (args) => {
                this.logger.info('Tool called', { tool: 'list_endpoints' });
                try {
                    const result = await this.listEndpointsUseCase.execute(args);
                    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
                } catch (error) {
                    return this.errorResponse(error);
                }
            }
        );
    }

    private registerAnalyzeEndpoint(): void {
        this.server.registerTool(
            'analyze_endpoint',
            {
                title: 'Analyze Endpoint',
                description: 'Analyze a specific endpoint to understand its parameters, request body, responses, and security',
                inputSchema: {
                    path: z.string().describe('Endpoint path (e.g., /pets/{petId})'),
                    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).describe('HTTP method')
                }
            },
            async (args) => {
                this.logger.info('Tool called', { tool: 'analyze_endpoint' });
                try {
                    const result = await this.analyzeEndpointUseCase.execute(args);
                    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
                } catch (error) {
                    return this.errorResponse(error);
                }
            }
        );
    }

    private registerGenerateScenarios(): void {
        this.server.registerTool(
            'generate_scenarios',
            {
                title: 'Generate Scenarios',
                description: 'Generate BDD test scenarios for the previously analyzed endpoint',
                inputSchema: {
                    scenarioTypes: z.array(z.nativeEnum(ScenarioType)).optional().describe('Types of scenarios to generate'),
                    includeBackground: z.boolean().optional().describe('Whether to include background steps')
                }
            },
            async (args) => {
                this.logger.info('Tool called', { tool: 'generate_scenarios' });
                try {
                    const result = await this.generateScenariosUseCase.execute(args);
                    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
                } catch (error) {
                    return this.errorResponse(error);
                }
            }
        );
    }

    private registerExportFeature(): void {
        this.server.registerTool(
            'export_feature',
            {
                title: 'Export Feature',
                description: 'Export generated scenarios to a feature file in Gherkin, JSON, or Markdown format',
                inputSchema: {
                    format: z.enum(['gherkin', 'json', 'markdown']).default('gherkin').describe('Output format'),
                    outputPath: z.string().optional().describe('File path to write output to'),
                    includeComments: z.boolean().default(true).describe('Whether to include metadata comments')
                },
                annotations: {
                    readOnlyHint: true
                }
            },
            async (args) => {
                this.logger.info('Tool called', { tool: 'export_feature' });
                try {
                    const result = await this.exportFeatureUseCase.execute(args);
                    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
                } catch (error) {
                    return this.errorResponse(error);
                }
            }
        );
    }

    private errorResponse(error: unknown) {
        this.logger.error('Tool execution failed', error as Error);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    success: false,
                    error: (error as Error).message
                }, null, 2)
            }],
            isError: true as const
        };
    }

    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('MCP Server started successfully');
    }
}
