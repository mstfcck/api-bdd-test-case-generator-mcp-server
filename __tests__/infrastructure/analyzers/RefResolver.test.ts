import 'reflect-metadata';
import { RefResolver } from '../../../src/infrastructure/analyzers/RefResolver';
import { InvalidReferenceError } from '../../../src/domain/errors/InvalidReferenceError';
import type { OpenAPIV3 } from 'openapi-types';

describe('RefResolver', () => {
    let resolver: RefResolver;
    let testDocument: OpenAPIV3.Document;

    beforeEach(() => {
        resolver = new RefResolver();
        testDocument = {
            openapi: '3.0.0',
            info: { title: 'Test API', version: '1.0.0' },
            paths: {},
            components: {
                schemas: {
                    Pet: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' }
                        }
                    },
                    NewPet: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        }
                    },
                    Error: {
                        type: 'object',
                        properties: {
                            code: { type: 'integer' },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        };
    });

    describe('resolve', () => {
        it('should resolve schema reference', () => {
            const result = resolver.resolve<any>('#/components/schemas/Pet', testDocument);

            expect(result).toBeDefined();
            expect(result.type).toBe('object');
            expect(result.properties).toHaveProperty('id');
            expect(result.properties).toHaveProperty('name');
        });

        it('should resolve nested reference path', () => {
            const result = resolver.resolve<any>('#/components/schemas/NewPet', testDocument);

            expect(result).toBeDefined();
            expect(result.type).toBe('object');
            expect(result.properties).toHaveProperty('name');
        });

        it('should cache resolved references', () => {
            const result1 = resolver.resolve('#/components/schemas/Pet', testDocument);
            const result2 = resolver.resolve('#/components/schemas/Pet', testDocument);

            expect(result1).toBe(result2);
        });

        it('should throw error for invalid reference', () => {
            expect(() => resolver.resolve('#/components/schemas/NonExistent', testDocument))
                .toThrow(InvalidReferenceError);
        });

        it('should throw error for malformed reference', () => {
            expect(() => resolver.resolve('invalid-ref', testDocument))
                .toThrow();
        });
    });

    describe('resolveSchema', () => {
        it('should resolve schema with $ref', () => {
            const schema = { $ref: '#/components/schemas/Pet' };
            const result = resolver.resolveSchema(schema, testDocument);

            expect(result).toBeDefined();
            expect(result.type).toBe('object');
            expect((result as any).properties).toHaveProperty('id');
        });

        it('should return schema as-is if no $ref', () => {
            const schema = { type: 'object', properties: { test: { type: 'string' } } };
            const result = resolver.resolveSchema(schema as any, testDocument);

            expect(result).toEqual(schema);
        });
    });

    describe('clearCache', () => {
        it('should clear cached references', () => {
            resolver.resolve('#/components/schemas/Pet', testDocument);
            resolver.clearCache();

            const result = resolver.resolve<any>('#/components/schemas/Error', testDocument);
            expect(result).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle deeply nested references', () => {
            const deepDoc: OpenAPIV3.Document = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {},
                components: {
                    schemas: {
                        Level1: {
                            type: 'object',
                            properties: {
                                nested: { $ref: '#/components/schemas/Level2' }
                            }
                        },
                        Level2: {
                            type: 'object',
                            properties: {
                                value: { type: 'string' }
                            }
                        }
                    }
                }
            };

            const result = resolver.resolve<any>('#/components/schemas/Level1', deepDoc);
            expect(result).toBeDefined();
            expect(result.type).toBe('object');
        });

        it('should throw error for reference without hash', () => {
            expect(() => resolver.resolve('components/schemas/Pet', testDocument))
                .toThrow();
        });

        it('should handle empty reference path', () => {
            expect(() => resolver.resolve('#/', testDocument))
                .toThrow();
        });
    });
});
