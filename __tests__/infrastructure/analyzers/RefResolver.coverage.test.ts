import { RefResolver } from '../../../src/infrastructure/analyzers/RefResolver';
import { CircularReferenceError, InvalidReferenceError } from '../../../src/domain/errors/index';
import { OpenAPIV3 } from 'openapi-types';

describe('RefResolver Coverage Tests', () => {
    let resolver: RefResolver;
    let spec: OpenAPIV3.Document;

    beforeEach(() => {
        resolver = new RefResolver();
        spec = {
            openapi: '3.0.0',
            info: { title: 'Test API', version: '1.0.0' },
            paths: {},
            components: {
                schemas: {
                    Simple: {
                        type: 'string'
                    },
                    CircularA: {
                        $ref: '#/components/schemas/CircularB'
                    },
                    CircularB: {
                        $ref: '#/components/schemas/CircularA'
                    },
                    NestedA: {
                        $ref: '#/components/schemas/NestedB'
                    },
                    NestedB: {
                        type: 'integer'
                    },
                    // @ts-ignore - Testing undefined value
                    UndefinedValue: undefined
                }
            }
        };
    });

    test('should throw CircularReferenceError when detecting a circular reference', () => {
        expect(() => {
            resolver.resolve('#/components/schemas/CircularA', spec);
        }).toThrow(CircularReferenceError);
    });

    test('should return the schema as-is if it is not a reference', () => {
        const schema = { type: 'string' } as any;
        const result = resolver.resolveSchema(schema, spec);
        expect(result).toBe(schema);
    });

    test('should resolve nested references', () => {
        const result = resolver.resolve('#/components/schemas/NestedA', spec);
        expect(result).toEqual({ type: 'integer' });
    });

    test('should throw InvalidReferenceError if resolved value is undefined', () => {
        // We need to manually construct an object where the key exists but value is undefined
        // to bypass the "in" check but fail the final undefined check
        const specWithUndefined = {
            openapi: '3.0.0',
            info: { title: 'Test', version: '1.0.0' },
            paths: {},
            components: {
                schemas: {}
            }
        };

        // Force undefined property
        Object.defineProperty(specWithUndefined.components.schemas, 'UndefinedValue', {
            value: undefined,
            enumerable: true,
            writable: true
        });

        expect(() => {
            resolver.resolve('#/components/schemas/UndefinedValue', specWithUndefined as any);
        }).toThrow(InvalidReferenceError);

        try {
            resolver.resolve('#/components/schemas/UndefinedValue', specWithUndefined as any);
        } catch (error: any) {
            expect(error).toBeInstanceOf(InvalidReferenceError);
            expect(error.message).toContain('Reference not found');
            expect(error.reason).toBe('Reference resolved to undefined');
        }
    });

    test('should track resolved references', () => {
        const ref = '#/components/schemas/Simple';
        expect(resolver.hasBeenResolved(ref)).toBe(false);
        resolver.resolve(ref, spec);
        expect(resolver.hasBeenResolved(ref)).toBe(true);
    });

    test('should clear cache', () => {
        const ref = '#/components/schemas/Simple';
        resolver.resolve(ref, spec);
        expect(resolver.hasBeenResolved(ref)).toBe(true);

        resolver.clearCache();
        expect(resolver.hasBeenResolved(ref)).toBe(false);
    });
});
