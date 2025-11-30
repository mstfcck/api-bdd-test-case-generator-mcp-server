import { injectable, inject } from 'inversify';
import { ISpecificationRepository, IStateRepository } from '../ports/index.js';
import { IEndpointAnalyzer } from '../../domain/services/index.js';
import { AnalyzeEndpointRequest, AnalyzeEndpointResponse } from '../dtos/index.js';
import { Logger } from '../../shared/index.js';
import { SpecificationNotFoundError } from '../../domain/errors/index.js';
import { Endpoint } from '../../domain/entities/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class AnalyzeEndpointUseCase {
    constructor(
        @inject(TYPES.ISpecificationRepository) private specRepository: ISpecificationRepository,
        @inject(TYPES.IStateRepository) private stateRepository: IStateRepository,
        @inject(TYPES.IEndpointAnalyzer) private endpointAnalyzer: IEndpointAnalyzer,
        @inject(TYPES.Logger) private logger: Logger
    ) { }

    async execute(request: AnalyzeEndpointRequest): Promise<AnalyzeEndpointResponse> {
        this.logger.info('Analyzing endpoint', { request });

        const spec = await this.specRepository.get();
        if (!spec) {
            throw new SpecificationNotFoundError('No specification loaded. Please load a specification first.');
        }

        // Get the path item
        const pathItem = spec.getPath(request.path);
        if (!pathItem) {
            throw new Error(`Path not found: ${request.path}`);
        }

        // Get the operation
        const operation = (pathItem as any)[request.method.toLowerCase()];
        if (!operation) {
            throw new Error(`Method ${request.method} not found for path ${request.path}`);
        }

        // Create endpoint entity
        const endpoint = Endpoint.create(request.path, request.method, operation);

        // Analyze the endpoint
        const analysis = this.endpointAnalyzer.analyze(spec, endpoint);

        // Save to state
        await this.stateRepository.saveEndpointContext(analysis);

        // Generate insights
        const insights = {
            hasAuthentication: analysis.security.length > 0,
            hasRequestBody: !!analysis.requestBody,
            hasPathParameters: analysis.parameters.some(p => p.in === 'path'),
            hasQueryParameters: analysis.parameters.some(p => p.in === 'query'),
            responseCount: analysis.responses.size,
            relatedEndpointCount: analysis.relatedEndpoints.length
        };

        const response: AnalyzeEndpointResponse = {
            success: true,
            analysis,
            insights
        };

        this.logger.info('Endpoint analyzed successfully', {
            path: request.path,
            method: request.method,
            insights
        });

        return response;
    }
}
