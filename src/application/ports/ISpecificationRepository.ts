import { OpenAPISpecification } from '../../domain/entities/index.js';

export interface ISpecificationRepository {
    /**
     * Save a specification to the repository
     */
    save(spec: OpenAPISpecification): Promise<void>;

    /**
     * Retrieve the current specification
     */
    get(): Promise<OpenAPISpecification | null>;

    /**
     * Check if a specification exists
     */
    exists(): Promise<boolean>;

    /**
     * Clear the specification from the repository
     */
    clear(): Promise<void>;
}
