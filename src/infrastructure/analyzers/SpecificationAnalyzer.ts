import { injectable, inject } from 'inversify';
import * as yaml from 'js-yaml';
import { ISpecificationAnalyzer } from '../../domain/services/index.js';
import { IFileSystem } from '../../application/ports/index.js';
import { OpenAPISpecification } from '../../domain/entities/index.js';
import { ValidationError } from '../../domain/errors/index.js';
import { TYPES } from '../../di/types.js';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

@injectable()
export class SpecificationAnalyzer implements ISpecificationAnalyzer {
    constructor(
        @inject(TYPES.IFileSystem) private fileSystem: IFileSystem
    ) { }

    async loadFromFile(filePath: string): Promise<OpenAPISpecification> {
        const content = await this.fileSystem.readFile(filePath);

        // Determine format from extension
        const isJson = filePath.endsWith('.json');
        const format = isJson ? 'json' : 'yaml';

        return this.loadFromContent(content, format);
    }

    async loadFromContent(content: string, format: 'yaml' | 'json'): Promise<OpenAPISpecification> {
        try {
            // Parse content
            const parsed = format === 'json' ? JSON.parse(content) : yaml.load(content);

            // Validate basic structure
            this.validateBasicStructure(parsed);

            // Create specification entity
            const spec = OpenAPISpecification.create(
                parsed as OpenAPIV3.Document | OpenAPIV3_1.Document,
                format === 'json' ? 'content-json' : 'content-yaml'
            );

            return spec;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError(
                `Failed to parse specification: ${(error as Error).message}`
            );
        }
    }

    validate(spec: OpenAPISpecification): void {
        spec.validate();
    }

    private validateBasicStructure(spec: unknown): void {
        if (typeof spec !== 'object' || spec === null) {
            throw new ValidationError('Invalid specification: must be an object');
        }

        const typedSpec = spec as Record<string, unknown>;

        if (!typedSpec.openapi && !typedSpec.swagger) {
            throw new ValidationError('Not a valid OpenAPI specification: missing openapi/swagger version');
        }

        const version = typedSpec.openapi || typedSpec.swagger;
        if (typeof version !== 'string' || (!version.startsWith('3.0') && !version.startsWith('3.1'))) {
            throw new ValidationError(
                `Unsupported OpenAPI version: ${version}. Only 3.0.x and 3.1.x are supported`
            );
        }

        if (!typedSpec.paths || typeof typedSpec.paths !== 'object') {
            throw new ValidationError('Invalid specification: paths object is required');
        }

        const info = typedSpec.info as Record<string, unknown> | undefined;
        if (!info || typeof info !== 'object' || !info.title || !info.version) {
            throw new ValidationError('Invalid specification: info.title and info.version are required');
        }
    }
}
