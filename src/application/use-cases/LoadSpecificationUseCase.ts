import { injectable, inject } from 'inversify';
import { ISpecificationParser } from '../../domain/services/index.js';
import { ISpecificationRepository, IFileSystem } from '../ports/index.js';
import { LoadSpecRequest, LoadSpecResponse } from '../dtos/index.js';
import { type ILogger } from '../../shared/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class LoadSpecificationUseCase {
    constructor(
        @inject(TYPES.ISpecificationParser) private readonly specParser: ISpecificationParser,
        @inject(TYPES.ISpecificationRepository) private readonly specRepository: ISpecificationRepository,
        @inject(TYPES.IFileSystem) private readonly fileSystem: IFileSystem,
        @inject(TYPES.ILogger) private readonly logger: ILogger
    ) { }

    async execute(request: LoadSpecRequest): Promise<LoadSpecResponse> {
        this.logger.info('Loading OpenAPI specification', { request });

        try {
            let spec;

            if (request.filePath) {
                // Load from file
                const exists = await this.fileSystem.exists(request.filePath);
                if (!exists) {
                    throw new Error(`File not found: ${request.filePath}`);
                }
                const content = await this.fileSystem.readFile(request.filePath);
                const format = request.filePath.endsWith('.json') ? 'json' : 'yaml';
                spec = await this.specParser.parse(content, format);
            } else if (request.content) {
                // Load from content
                const format = request.format || 'yaml';
                spec = await this.specParser.parse(request.content, format);
            } else {
                throw new Error('Either filePath or content must be provided');
            }

            // Validate specification
            this.specParser.validate(spec);

            // Save to repository
            await this.specRepository.save(spec);

            const metadata = spec.getMetadata();
            const response: LoadSpecResponse = {
                success: true,
                specification: {
                    title: metadata.title,
                    version: metadata.version,
                    openApiVersion: metadata.openApiVersion,
                    servers: metadata.servers,
                    pathCount: spec.getAllPaths().length
                },
                loadedAt: new Date(),
                source: request.filePath || 'content'
            };

            this.logger.info('Specification loaded successfully', {
                title: metadata.title,
                pathCount: spec.getAllPaths().length
            });

            return response;
        } catch (error) {
            this.logger.error('Failed to load specification', error as Error);
            throw error;
        }
    }
}
