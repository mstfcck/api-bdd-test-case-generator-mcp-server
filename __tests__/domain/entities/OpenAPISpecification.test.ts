import 'reflect-metadata';
import { OpenAPISpecification } from '../../../src/domain/entities/OpenAPISpecification';
import { ValidationError } from '../../../src/domain/errors/ValidationError';
import type { OpenAPIV3 } from 'openapi-types';

describe('OpenAPISpecification', () => {
    const validDocument: OpenAPIV3.Document = {
        openapi: '3.0.0',
        info: {
            title: 'Test API',
            version: '1.0.0',
            description: 'A test API'
        },
        servers: [
            { url: 'https://api.example.com' }
        ],
        paths: {
            '/pets': {
                get: {
                    operationId: 'listPets',
                    responses: {
                        '200': { description: 'Success' }
                    }
                }
            },
            '/pets/{petId}': {
                get: {
                    operationId: 'getPet',
                    responses: {
                        '200': { description: 'Success' }
                    }
                }
            }
        },
        components: {
            schemas: {
                Pet: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
                    }
                }
            },
            securitySchemes: {
                apiKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            }
        }
    };

    describe('create', () => {
        it('should create specification from valid document', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test-source');

            expect(spec).toBeDefined();
            expect(spec.getTitle()).toBe('Test API');
            expect(spec.getVersion()).toBe('1.0.0');
            expect(spec.getSource()).toBe('test-source');
        });

        it('should extract metadata correctly', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            const metadata = spec.getMetadata();
            expect(metadata.title).toBe('Test API');
            expect(metadata.version).toBe('1.0.0');
            expect(metadata.description).toBe('A test API');
            expect(metadata.openApiVersion).toBe('3.0.0');
            expect(metadata.servers).toContain('https://api.example.com');
            expect(metadata.securitySchemes).toContain('apiKey');
        });

        it('should handle document without servers', () => {
            const docWithoutServers = { ...validDocument, servers: undefined };
            const spec = OpenAPISpecification.create(docWithoutServers, 'test');

            expect(spec.getMetadata().servers).toEqual([]);
        });

        it('should handle document without security schemes', () => {
            const docWithoutSecurity = {
                ...validDocument,
                components: {
                    ...validDocument.components,
                    securitySchemes: undefined
                }
            };
            const spec = OpenAPISpecification.create(docWithoutSecurity, 'test');

            expect(spec.getMetadata().securitySchemes).toEqual([]);
        });

        it('should handle document without components', () => {
            const docWithoutComponents = { ...validDocument, components: undefined };
            const spec = OpenAPISpecification.create(docWithoutComponents, 'test');

            expect(spec.getMetadata().securitySchemes).toEqual([]);
        });
    });

    describe('getDocument', () => {
        it('should return the document', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            expect(spec.getDocument()).toBe(validDocument);
        });
    });

    describe('getOpenApiVersion', () => {
        it('should return openapi version', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            expect(spec.getOpenApiVersion()).toBe('3.0.0');
        });
    });

    describe('hasPath', () => {
        it('should return true for existing path', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            expect(spec.hasPath('/pets')).toBe(true);
        });

        it('should return false for non-existing path', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            expect(spec.hasPath('/non-existent')).toBe(false);
        });

        it('should handle document without paths', () => {
            const docWithoutPaths: any = {
                ...validDocument,
                paths: undefined
            };
            const spec = OpenAPISpecification.create(docWithoutPaths, 'test');

            expect(spec.hasPath('/pets')).toBe(false);
        });
    });

    describe('getPath', () => {
        it('should return path item for existing path', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            const pathItem = spec.getPath('/pets');
            expect(pathItem).toBeDefined();
            expect(pathItem?.get).toBeDefined();
        });

        it('should return undefined for non-existing path', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            expect(spec.getPath('/non-existent')).toBeUndefined();
        });

        it('should handle document without paths', () => {
            const docWithoutPaths: any = {
                ...validDocument,
                paths: undefined
            };
            const spec = OpenAPISpecification.create(docWithoutPaths, 'test');

            expect(spec.getPath('/pets')).toBeUndefined();
        });
    });

    describe('getAllPaths', () => {
        it('should return all paths', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            const paths = spec.getAllPaths();
            expect(paths).toContain('/pets');
            expect(paths).toContain('/pets/{petId}');
            expect(paths.length).toBe(2);
        });

        it('should return empty array for document without paths', () => {
            const docWithoutPaths: any = {
                ...validDocument,
                paths: undefined
            };
            const spec = OpenAPISpecification.create(docWithoutPaths, 'test');

            expect(spec.getAllPaths()).toEqual([]);
        });
    });

    describe('getComponents', () => {
        it('should return components', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            const components = spec.getComponents();
            expect(components).toBeDefined();
            expect(components?.schemas).toBeDefined();
            expect(components?.securitySchemes).toBeDefined();
        });

        it('should return undefined when no components', () => {
            const docWithoutComponents = { ...validDocument, components: undefined };
            const spec = OpenAPISpecification.create(docWithoutComponents, 'test');

            expect(spec.getComponents()).toBeUndefined();
        });
    });

    describe('getSecuritySchemes', () => {
        it('should return security schemes', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            const schemes = spec.getSecuritySchemes();
            expect(schemes).toBeDefined();
            expect(schemes?.apiKey).toBeDefined();
        });

        it('should return undefined when no components', () => {
            const docWithoutComponents = { ...validDocument, components: undefined };
            const spec = OpenAPISpecification.create(docWithoutComponents, 'test');

            expect(spec.getSecuritySchemes()).toBeUndefined();
        });

        it('should return undefined when no security schemes', () => {
            const docWithoutSecurity = {
                ...validDocument,
                components: { schemas: {} }
            };
            const spec = OpenAPISpecification.create(docWithoutSecurity, 'test');

            expect(spec.getSecuritySchemes()).toBeUndefined();
        });
    });

    describe('validate', () => {
        it('should validate successfully for valid document', () => {
            const spec = OpenAPISpecification.create(validDocument, 'test');

            expect(() => spec.validate()).not.toThrow();
        });

        it('should throw ValidationError for missing openapi version', () => {
            const invalidDoc: any = { ...validDocument, openapi: undefined };
            const spec = OpenAPISpecification.create(invalidDoc, 'test');

            expect(() => spec.validate()).toThrow(ValidationError);
            expect(() => spec.validate()).toThrow('Missing openapi version');
        });

        it('should throw ValidationError for missing info.title', () => {
            const invalidDoc: any = {
                ...validDocument,
                info: { version: '1.0.0' }
            };
            const spec = OpenAPISpecification.create(invalidDoc, 'test');

            expect(() => spec.validate()).toThrow('Missing info.title');
        });

        it('should throw ValidationError for missing info.version', () => {
            const invalidDoc: any = {
                ...validDocument,
                info: { title: 'Test' }
            };
            const spec = OpenAPISpecification.create(invalidDoc, 'test');

            expect(() => spec.validate()).toThrow('Missing info.version');
        });

        it('should throw error for missing info', () => {
            const invalidDoc: any = {
                openapi: '3.0.0',
                paths: {}
                // info is missing
            };

            // Should throw during create due to metadata extraction
            expect(() => OpenAPISpecification.create(invalidDoc, 'test')).toThrow();
        });
    });
});
