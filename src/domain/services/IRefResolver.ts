import type { SchemaObject, ReferenceObject, SchemaOrRef, OpenAPIDocument } from '../types/index.js';

export interface IRefResolver {
    /**
     * Resolve a $ref reference to its actual schema
     */
    resolve<T = unknown>(
        ref: string,
        spec: OpenAPIDocument
    ): T;

    /**
     * Resolve a schema that may contain references
     */
    resolveSchema(
        schema: SchemaOrRef,
        spec: OpenAPIDocument
    ): SchemaObject;

    /**
     * Check if a reference has been resolved (for circular detection)
     */
    hasBeenResolved(ref: string): boolean;

    /**
     * Clear resolution cache
     */
    clearCache(): void;
}
