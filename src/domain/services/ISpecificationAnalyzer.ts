import { OpenAPISpecification } from '../entities/index.js';

export interface ISpecificationAnalyzer {
    /**
     * Load and validate OpenAPI specification from file path
     */
    loadFromFile(filePath: string): Promise<OpenAPISpecification>;

    /**
     * Load and validate OpenAPI specification from content string
     */
    loadFromContent(content: string, format: 'yaml' | 'json'): Promise<OpenAPISpecification>;

    /**
     * Validate an OpenAPI specification document
     */
    validate(spec: OpenAPISpecification): void;
}
