import { injectable, inject } from 'inversify';
import { ISpecificationAnalyzer } from '../../domain/services/index.js';
import { ISpecificationRepository, IFileSystem } from '../ports/index.js';
import { LoadSpecRequest, LoadSpecResponse } from '../dtos/index.js';
import { Logger } from '../../shared/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class LoadSpecificationUseCase {
    constructor(
        @inject(TYPES.ISpecificationAnalyzer) private specAnalyzer: ISpecificationAnalyzer,
        @inject(TYPES.ISpecificationRepository) private specRepository: ISpecificationRepository,
        @inject(TYPES.IFileSystem) private fileSystem: IFileSystem,
        @inject(TYPES.Logger) private logger: Logger
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
                spec = await this.specAnalyzer.loadFromFile(request.filePath);
            } else if (request.content) {
                // Load from content
                const format = request.format || 'yaml';
                spec = await this.specAnalyzer.loadFromContent(request.content, format);
            } else {
                throw new Error('Either filePath or content must be provided');
            }

            // Validate specification
            this.specAnalyzer.validate(spec);

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
