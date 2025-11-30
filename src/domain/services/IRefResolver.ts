import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

export interface IRefResolver {
    /**
     * Resolve a $ref reference to its actual schema
     */
    resolve<T = unknown>(
        ref: string,
        spec: OpenAPIV3.Document | OpenAPIV3_1.Document
    ): T;

    /**
     * Resolve a schema that may contain references
     */
    resolveSchema(
        schema: SchemaObject | ReferenceObject,
        spec: OpenAPIV3.Document | OpenAPIV3_1.Document
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
