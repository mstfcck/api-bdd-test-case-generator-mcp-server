import { OpenAPISpecification } from '../entities/index.js';

/**
 * Domain service for parsing and validating OpenAPI specifications.
 * No infrastructure concerns (file paths, formats) — those belong in application/infrastructure.
 */
export interface ISpecificationParser {
    /**
     * Parse and create an OpenAPI specification from raw content.
     */
    parse(content: string, format: 'yaml' | 'json'): Promise<OpenAPISpecification>;

    /**
     * Validate an OpenAPI specification document structure.
     */
    validate(spec: OpenAPISpecification): void;
}
