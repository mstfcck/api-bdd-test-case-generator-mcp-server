import 'reflect-metadata';
import { Endpoint } from '../../../src/domain/entities/Endpoint';
import type { OpenAPIV3 } from 'openapi-types';

describe('Endpoint', () => {
    describe('create', () => {
        it('should create endpoint with basic properties', () => {
            const operation: OpenAPIV3.OperationObject = {
                operationId: 'listPets',
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getPath()).toBe('/pets');
            expect(endpoint.getMethod().getValue()).toBe('GET');
            expect(endpoint.getOperationId()).toBe('listPets');
        });

        it('should create endpoint without operationId', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'POST', operation);

            expect(endpoint.getPath()).toBe('/pets');
            expect(endpoint.getMethod().getValue()).toBe('POST');
            expect(endpoint.getOperationId()).toBeUndefined();
        });

        it('should create endpoint with summary and description', () => {
            const operation: OpenAPIV3.OperationObject = {
                summary: 'Get pet by ID',
                description: 'Returns a single pet',
                responses: {}
            };

            const endpoint = Endpoint.create('/pets/{id}', 'GET', operation);

            expect(endpoint.getSummary()).toBe('Get pet by ID');
            expect(endpoint.getDescription()).toBe('Returns a single pet');
        });

        it('should throw error for invalid path', () => {
            const operation: OpenAPIV3.OperationObject = { responses: {} };

            expect(() => Endpoint.create('pets', 'GET', operation))
                .toThrow('Invalid endpoint path');
        });

        it('should throw error for empty path', () => {
            const operation: OpenAPIV3.OperationObject = { responses: {} };

            expect(() => Endpoint.create('', 'GET', operation))
                .toThrow('Invalid endpoint path');
        });
    });

    describe('getters', () => {
        it('should get tags', () => {
            const operation: OpenAPIV3.OperationObject = {
                tags: ['pets', 'animals'],
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getTags()).toEqual(['pets', 'animals']);
        });

        it('should return empty array when no tags', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getTags()).toEqual([]);
        });

        it('should get parameters', () => {
            const operation: OpenAPIV3.OperationObject = {
                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer' }
                    }
                ],
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getParameters()).toHaveLength(1);
            expect(endpoint.getParameters()[0].name).toBe('limit');
        });

        it('should get request body', () => {
            const operation: OpenAPIV3.OperationObject = {
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { type: 'object' }
                        }
                    }
                },
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'POST', operation);

            expect(endpoint.getRequestBody()).toBeDefined();
        });

        it('should get responses', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'Success'
                    }
                }
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getResponses()).toBeDefined();
            expect(endpoint.getResponses()?.['200']).toBeDefined();
        });

        it('should get security requirements', () => {
            const operation: OpenAPIV3.OperationObject = {
                security: [{ apiKey: [] }],
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getSecurity()).toHaveLength(1);
        });
    });

    describe('boolean checks', () => {
        it('should check if deprecated', () => {
            const operation: OpenAPIV3.OperationObject = {
                deprecated: true,
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.isDeprecated()).toBe(true);
        });

        it('should return false if not deprecated', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.isDeprecated()).toBe(false);
        });

        it('should check if has request body', () => {
            const operation: OpenAPIV3.OperationObject = {
                requestBody: {
                    content: {}
                },
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'POST', operation);

            expect(endpoint.hasRequestBody()).toBe(true);
        });

        it('should return false if no request body', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.hasRequestBody()).toBe(false);
        });

        it('should check if has parameters', () => {
            const operation: OpenAPIV3.OperationObject = {
                parameters: [{ name: 'id', in: 'path', schema: {} }],
                responses: {}
            };

            const endpoint = Endpoint.create('/pets/{id}', 'GET', operation);

            expect(endpoint.hasParameters()).toBe(true);
        });

        it('should return false if no parameters', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.hasParameters()).toBe(false);
        });

        it('should check if has security', () => {
            const operation: OpenAPIV3.OperationObject = {
                security: [{ bearer: [] }],
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.hasSecurity()).toBe(true);
        });

        it('should return false if no security', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {}
            };

            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.hasSecurity()).toBe(false);
        });
    });

    describe('getIdentifier', () => {
        it('should return method and path', () => {
            const operation: OpenAPIV3.OperationObject = { responses: {} };
            const endpoint = Endpoint.create('/pets', 'GET', operation);

            expect(endpoint.getIdentifier()).toBe('GET /pets');
        });

        it('should return method and path with parameters', () => {
            const operation: OpenAPIV3.OperationObject = { responses: {} };
            const endpoint = Endpoint.create('/pets/{id}', 'DELETE', operation);

            expect(endpoint.getIdentifier()).toBe('DELETE /pets/{id}');
        });
    });

    describe('equals', () => {
        it('should return true for same path and method', () => {
            const operation1: OpenAPIV3.OperationObject = {
                summary: 'Summary 1',
                responses: {}
            };
            const operation2: OpenAPIV3.OperationObject = {
                summary: 'Summary 2',
                responses: {}
            };

            const endpoint1 = Endpoint.create('/pets', 'GET', operation1);
            const endpoint2 = Endpoint.create('/pets', 'GET', operation2);

            expect(endpoint1.equals(endpoint2)).toBe(true);
        });

        it('should return false for different paths', () => {
            const operation: OpenAPIV3.OperationObject = { responses: {} };

            const endpoint1 = Endpoint.create('/pets', 'GET', operation);
            const endpoint2 = Endpoint.create('/users', 'GET', operation);

            expect(endpoint1.equals(endpoint2)).toBe(false);
        });

        it('should return false for different methods', () => {
            const operation: OpenAPIV3.OperationObject = { responses: {} };

            const endpoint1 = Endpoint.create('/pets', 'GET', operation);
            const endpoint2 = Endpoint.create('/pets', 'POST', operation);

            expect(endpoint1.equals(endpoint2)).toBe(false);
        });
    });
});
