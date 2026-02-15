import { injectable } from 'inversify';
import * as yaml from 'js-yaml';
import { ISpecificationParser } from '../../domain/services/index.js';
import { OpenAPISpecification } from '../../domain/entities/index.js';
import { ValidationError } from '../../domain/errors/index.js';
import type { OpenAPIDocument } from '../../domain/types/index.js';

@injectable()
export class SpecificationAnalyzer implements ISpecificationParser {
    async parse(content: string, format: 'yaml' | 'json'): Promise<OpenAPISpecification> {
        try {
            const parsed = format === 'json' ? JSON.parse(content) : yaml.load(content);

            this.validateBasicStructure(parsed);

            const spec = OpenAPISpecification.create(
                parsed as OpenAPIDocument,
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
