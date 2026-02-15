import { injectable } from 'inversify';
import { IRefResolver } from '../../domain/services/index.js';
import { CircularReferenceError, InvalidReferenceError } from '../../domain/errors/index.js';
import type { OpenAPIDocument, SchemaObject, ReferenceObject, SchemaOrRef } from '../../domain/types/index.js';

@injectable()
export class RefResolver implements IRefResolver {
    private readonly cache = new Map<string, unknown>();
    private readonly resolving = new Set<string>();

    resolve<T = unknown>(ref: string, spec: OpenAPIDocument): T {
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
        schema: SchemaOrRef,
        spec: OpenAPIDocument
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

    private isRef(obj: unknown): obj is ReferenceObject {
        return !!(obj && typeof obj === 'object' && '$ref' in obj);
    }

    private resolveLocal(ref: string, spec: OpenAPIDocument): unknown {
        if (!ref.startsWith('#/')) {
            throw new InvalidReferenceError(
                `Invalid local reference: ${ref}. Must start with #/`,
                ref,
                'Not a local reference'
            );
        }

        const path = ref.substring(2).split('/');
        let current: unknown = spec;

        for (const segment of path) {
            // Handle escaped characters in segment
            const decodedSegment = segment.replace(/~1/g, '/').replace(/~0/g, '~');

            if (typeof current !== 'object' || current === null || !(decodedSegment in current)) {
                throw new InvalidReferenceError(
                    `Invalid reference: ${ref}. Path not found at segment: ${segment}`,
                    ref,
                    `Path not found at ${segment}`
                );
            }

            current = (current as Record<string, unknown>)[decodedSegment];
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
            return this.resolve((current as ReferenceObject).$ref, spec);
        }

        return current;
    }
}
