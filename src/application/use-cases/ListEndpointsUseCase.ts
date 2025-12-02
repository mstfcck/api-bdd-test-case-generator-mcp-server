import { injectable, inject } from 'inversify';
import { ISpecificationRepository } from '../ports/index.js';
import { ListEndpointsRequest, ListEndpointsResponse, EndpointInfo } from '../dtos/index.js';
import { Logger } from '../../shared/index.js';
import { SpecificationNotFoundError } from '../../domain/errors/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class ListEndpointsUseCase {
    constructor(
        @inject(TYPES.ISpecificationRepository) private specRepository: ISpecificationRepository,
        @inject(TYPES.Logger) private logger: Logger
    ) { }

    async execute(request: ListEndpointsRequest): Promise<ListEndpointsResponse> {
        this.logger.info('Listing endpoints', { request });

        const spec = await this.specRepository.get();
        if (!spec) {
            throw new SpecificationNotFoundError('No specification loaded. Please load a specification first.');
        }

        const document = spec.getDocument();
        const endpoints: EndpointInfo[] = [];

        // Extract all endpoints
        for (const path of spec.getAllPaths()) {
            const pathItem = spec.getPath(path);
            if (!pathItem) continue;

            const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

            for (const method of methods) {
                const operation = (pathItem as any)[method];
                if (!operation) continue;

                const endpoint: EndpointInfo = {
                    path,
                    method: method.toUpperCase(),
                    operationId: operation.operationId,
                    summary: operation.summary,
                    description: operation.description,
                    tags: operation.tags || []
                };

                // Apply filters
                if (request.filter) {
                    if (request.filter.method && endpoint.method !== request.filter.method.toUpperCase()) {
                        continue;
                    }
                    if (request.filter.tag && !endpoint.tags.includes(request.filter.tag)) {
                        continue;
                    }
                    if (request.filter.path && !endpoint.path.includes(request.filter.path)) {
                        continue;
                    }
                }

                endpoints.push(endpoint);
            }
        }

        // Group by tag
        const groupedByTag: Record<string, EndpointInfo[]> = {};
        for (const endpoint of endpoints) {
            for (const tag of endpoint.tags) {
                if (!groupedByTag[tag]) {
                    groupedByTag[tag] = [];
                }
                groupedByTag[tag].push(endpoint);
            }
        }

        const response: ListEndpointsResponse = {
            success: true,
            endpoints,
            totalCount: endpoints.length,
            groupedByTag
        };

        this.logger.info('Listed endpoints successfully', { count: endpoints.length });

        return response;
    }
}
