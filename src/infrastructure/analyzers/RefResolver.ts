import { injectable } from 'inversify';
import { IRefResolver, type RefSchemaObject as SchemaObject, type ReferenceObject } from '../../domain/services/index.js';
import { CircularReferenceError, InvalidReferenceError } from '../../domain/errors/index.js';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

@injectable()
export class RefResolver implements IRefResolver {
    private cache: Map<string, any> = new Map();
    private resolving: Set<string> = new Set();

    resolve<T = unknown>(ref: string, spec: OpenAPIV3.Document | OpenAPIV3_1.Document): T {
        // Check cache
        if (this.cache.has(ref)) {
            return this.cache.get(ref) as T;
        }

        // Check for circular reference
        if (this.resolving.has(ref)) {
            throw new CircularReferenceError(
                `Circular reference detected: ${ref}`,
                Array.from(this.resolving),
                ref
            );
        }

        this.resolving.add(ref);

        try {
            const resolved = this.resolveLocal(ref, spec);
            this.cache.set(ref, resolved);
            return resolved as T;
        } finally {
            this.resolving.delete(ref);
        }
    }

    resolveSchema(
        schema: SchemaObject | ReferenceObject,
        spec: OpenAPIV3.Document | OpenAPIV3_1.Document
    ): SchemaObject {
        if (this.isRef(schema)) {
            return this.resolve<SchemaObject>(schema.$ref, spec);
        }
        return schema as SchemaObject;
    }

    hasBeenResolved(ref: string): boolean {
        return this.cache.has(ref);
    }

    clearCache(): void {
        this.cache.clear();
        this.resolving.clear();
    }

    private isRef(obj: any): obj is ReferenceObject {
        return !!(obj && typeof obj === 'object' && '$ref' in obj);
    }

    private resolveLocal(ref: string, spec: any): any {
        if (!ref.startsWith('#/')) {
            throw new InvalidReferenceError(
                `Invalid local reference: ${ref}. Must start with #/`,
                ref,
                'Not a local reference'
            );
        }

        const path = ref.substring(2).split('/');
        let current: any = spec;

        for (const segment of path) {
            // Handle escaped characters in segment
            const decodedSegment = segment.replace(/~1/g, '/').replace(/~0/g, '~');

            if (current === undefined || current === null) {
                throw new InvalidReferenceError(
                    `Invalid reference: ${ref}. Path not found at segment: ${segment}`,
                    ref,
                    `Path not found at ${segment}`
                );
            }

            current = current[decodedSegment];
        }

        if (current === undefined) {
            throw new InvalidReferenceError(
                `Reference not found: ${ref}`,
                ref,
                'Reference resolved to undefined'
            );
        }

        // Recursively resolve if the result is also a reference
        if (this.isRef(current)) {
            return this.resolve(current.$ref, spec);
        }

        return current;
    }
}
