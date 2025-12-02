import 'reflect-metadata';
import { EndpointAnalyzer } from '../../../src/infrastructure/analyzers/EndpointAnalyzer';
import { RefResolver } from '../../../src/infrastructure/analyzers/RefResolver';
import { Endpoint } from '../../../src/domain/entities/Endpoint';
import { OpenAPISpecification } from '../../../src/domain/entities/OpenAPISpecification';
import type { OpenAPIV3 } from 'openapi-types';

describe('EndpointAnalyzer', () => {
    let analyzer: EndpointAnalyzer;
    let refResolver: RefResolver;
    let testSpecDocument: OpenAPIV3.Document;
    let testSpec: OpenAPISpecification;

    beforeEach(() => {
        refResolver = new RefResolver();
        analyzer = new EndpointAnalyzer(refResolver);

        testSpecDocument = {
            openapi: '3.0.0',
            info: { title: 'Test API', version: '1.0.0' },
            paths: {
                '/pets': {
                    post: {
                        operationId: 'createPet',
                        summary: 'Create a pet',
                        parameters: [
                            {
                                name: 'limit',
                                in: 'query',
                                required: false,
                                schema: { type: 'integer', minimum: 1, maximum: 100 }
                            }
                        ],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['name'],
                                        properties: {
                                            name: { type: 'string', minLength: 1, maxLength: 50 },
                                            tag: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            '201': {
                                description: 'Created',
                                content: {
                                    'application/json': {
                                        schema: { $ref: '#/components/schemas/Pet' }
                                    }
                                }
                            },
                            '400': {
                                description: 'Bad Request',
                                content: {
                                    'application/json': {
                                        schema: { type: 'object', properties: { error: { type: 'string' } } }
                                    }
                                }
                            }
                        },
                        security: [{ apiKey: [] }]
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

        testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');
    });

    describe('analyze', () => {
        it('should analyze endpoint with all properties', () => {
            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result).toBeDefined();
            expect(result.path).toBe('/pets');
            expect(result.method).toBe('POST');
            expect(result.operationId).toBe('createPet');
            expect(result.summary).toBe('Create a pet');
        });

        it('should analyze parameters with constraints', () => {
            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.parameters).toHaveLength(1);
            expect(result.parameters[0].name).toBe('limit');
            expect(result.parameters[0].in).toBe('query');
            expect(result.parameters[0].required).toBe(false);
            expect(result.parameters[0].schema.constraints.minimum).toBe(1);
            expect(result.parameters[0].schema.constraints.maximum).toBe(100);
        });

        it('should analyze request body with schema', () => {
            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.requestBody).toBeDefined();
            expect(result.requestBody?.required).toBe(true);
            expect(result.requestBody?.schema.schema.type).toBe('object');
            expect(result.requestBody?.schema.constraints.required).toContain('name');
        });

        it('should analyze responses with different status codes', () => {
            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.responses.size).toBe(2);
            expect(result.responses.has('201')).toBe(true);
            expect(result.responses.has('400')).toBe(true);
        });

        it('should analyze security requirements', () => {
            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.security).toHaveLength(1);
            expect(result.security[0]).toHaveProperty('apiKey');
        });

        it('should handle endpoint without request body', () => {
            testSpecDocument.paths['/pets']!.get = {
                operationId: 'listPets',
                responses: {
                    '200': {
                        description: 'Success'
                    }
                }
            };
            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.get!;
            const endpoint = Endpoint.create('/pets', 'GET', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.requestBody).toBeUndefined();
        });

        it('should handle endpoint without parameters', () => {
            testSpecDocument.paths['/status'] = {
                get: {
                    operationId: 'getStatus',
                    responses: {
                        '200': { description: 'OK' }
                    }
                }
            };
            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/status']!.get!;
            const endpoint = Endpoint.create('/status', 'GET', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.parameters).toEqual([]);
        });

        it('should handle endpoint without security', () => {
            testSpecDocument.paths['/public'] = {
                get: {
                    operationId: 'getPublic',
                    responses: {
                        '200': { description: 'OK' }
                    }
                }
            };
            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/public']!.get!;
            const endpoint = Endpoint.create('/public', 'GET', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.security).toEqual([]);
        });

        it('should resolve schema references', () => {
            testSpecDocument.paths['/pets']!.get = {
                operationId: 'listPets',
                responses: {
                    '200': {
                        description: 'Success',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Pet' }
                                }
                            }
                        }
                    }
                }
            };
            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.get!;
            const endpoint = Endpoint.create('/pets', 'GET', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            const response = result.responses.get('200');
            expect(response).toBeDefined();
            expect(response?.schema).toBeDefined();
        });

        it('should handle path parameters with required=true', () => {
            testSpecDocument.paths['/pets/{petId}'] = {
                get: {
                    operationId: 'getPet',
                    parameters: [
                        {
                            name: 'petId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Success' }
                    }
                }
            };
            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets/{petId}']!.get!;
            const endpoint = Endpoint.create('/pets/{petId}', 'GET', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.parameters[0].name).toBe('petId');
            expect(result.parameters[0].required).toBe(true);
        });

        it('should handle responses without content', () => {
            testSpecDocument.paths['/pets/{petId}'] = {
                delete: {
                    operationId: 'deletePet',
                    parameters: [],
                    responses: {
                        '204': {
                            description: 'No Content'
                        }
                    }
                }
            };
            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets/{petId}']!.delete!;
            const endpoint = Endpoint.create('/pets/{petId}', 'DELETE', operation);

            const result = analyzer.analyze(testSpec, endpoint);

            expect(result.responses.size).toBe(1);
            expect(result.responses.has('204')).toBe(true);
        });
    });

    describe('findRelatedEndpoints', () => {
        it('should return empty array when no relationships exist', () => {
            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);

            expect(result).toEqual([]);
        });

        it('should include response link relationships via operationId', () => {
            testSpecDocument.paths['/pets/{petId}'] = {
                get: {
                    operationId: 'getPetById',
                    responses: {
                        '200': { description: 'OK' }
                    }
                }
            };

            (testSpecDocument.paths['/pets']!.post!.responses!['201'] as OpenAPIV3.ResponseObject).links = {
                getPet: {
                    operationId: 'getPetById',
                    description: 'Follow-up read'
                }
            };

            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);

            expect(result).toContainEqual({
                relationship: 'link',
                path: '/pets/{petId}',
                method: 'GET',
                via: 'getPet link in 201 response'
            });
        });

        it('should include callback relationships', () => {
            testSpecDocument.paths['/pets']!.post!.callbacks = {
                onPetCreated: {
                    '{$request.body#/callbackUrl}': {
                        post: {
                            operationId: 'petCreatedCallback',
                            responses: {
                                '200': { description: 'OK' }
                            }
                        }
                    }
                }
            } as OpenAPIV3.CallbackObject;

            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);

            expect(result).toContainEqual({
                relationship: 'callback',
                path: '{$request.body#/callbackUrl}',
                method: 'POST',
                via: 'onPetCreated callback'
            });
        });

        it('should include webhook relationships when referenced via operationRef', () => {
            (testSpecDocument as any).webhooks = {
                petStatusChanged: {
                    post: {
                        operationId: 'petStatusChanged',
                        responses: {
                            '200': { description: 'OK' }
                        }
                    }
                }
            };

            (testSpecDocument.paths['/pets']!.post!.responses!['201'] as OpenAPIV3.ResponseObject).links = {
                notifyWebhook: {
                    operationRef: '#/webhooks/petStatusChanged/post'
                }
            };

            testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');

            const operation: OpenAPIV3.OperationObject = testSpecDocument.paths['/pets']!.post!;
            const endpoint = Endpoint.create('/pets', 'POST', operation);

            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);

            expect(result).toContainEqual({
                relationship: 'webhook',
                path: 'petStatusChanged',
                method: 'POST',
                via: 'notifyWebhook link in 201 response'
            });
        });
    });
});
