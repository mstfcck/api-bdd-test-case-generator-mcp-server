import 'reflect-metadata';
import { EndpointAnalyzer } from '../../../src/infrastructure/analyzers/EndpointAnalyzer';
import { RefResolver } from '../../../src/infrastructure/analyzers/RefResolver';
import { Endpoint } from '../../../src/domain/entities/Endpoint';
import { OpenAPISpecification } from '../../../src/domain/entities/OpenAPISpecification';
import type { OpenAPIV3 } from 'openapi-types';

describe('EndpointAnalyzer Coverage', () => {
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
            paths: {},
            components: {}
        };
        testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');
    });

    describe('Edge Cases and Branch Coverage', () => {

        it('should handle undefined responses in analyzeResponses', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: undefined as any // Force undefined
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.responses.size).toBe(0);
        });

        it('should handle response without content', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': { description: 'OK' }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            const response = result.responses.get('200');
            expect(response?.schema).toBeUndefined();
        });

        it('should handle response with content but no schema', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {}
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            const response = result.responses.get('200');
            expect(response?.schema).toBeDefined();
            expect(response?.schema?.schema.type).toBe('object');
        });

        it('should handle request body with Ref', () => {
            testSpecDocument.components = {
                requestBodies: {
                    'TestBody': {
                        content: {
                            'application/json': {
                                schema: { type: 'string' }
                            }
                        }
                    }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                requestBody: { $ref: '#/components/requestBodies/TestBody' },
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.requestBody).toBeDefined();
            expect(result.requestBody?.schema.schema.type).toBe('string');
        });

        it('should handle request body with content but no schema', () => {
            const operation: OpenAPIV3.OperationObject = {
                requestBody: {
                    content: {
                        'application/json': {}
                    }
                },
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.requestBody?.schema.schema.type).toBe('object'); // Fallback
        });

        it('should handle parameter with Ref', () => {
            testSpecDocument.components = {
                parameters: {
                    'TestParam': {
                        name: 'test',
                        in: 'query',
                        schema: { type: 'string' }
                    }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                parameters: [{ $ref: '#/components/parameters/TestParam' }],
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.parameters[0].name).toBe('test');
        });

        it('should handle parameter with schema Ref', () => {
            testSpecDocument.components = {
                schemas: {
                    'TestSchema': { type: 'string' }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                parameters: [{
                    name: 'test',
                    in: 'query',
                    schema: { $ref: '#/components/schemas/TestSchema' }
                }],
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.parameters[0].schema.schema.type).toBe('string');
        });

        it('should handle parameter without schema (default to string)', () => {
            const operation: OpenAPIV3.OperationObject = {
                parameters: [{
                    name: 'test',
                    in: 'query'
                }],
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.parameters[0].schema.schema.type).toBe('string');
        });

        it('should handle schema with properties as Refs', () => {
            testSpecDocument.components = {
                schemas: {
                    'PropSchema': { type: 'string' }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        prop1: { $ref: '#/components/schemas/PropSchema' }
                                    }
                                }
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            const response = result.responses.get('200');
            expect(response?.schema?.constraints.properties?.prop1.type).toBe('string');
        });

        it('should handle schema with items as Ref', () => {
            testSpecDocument.components = {
                schemas: {
                    'ItemSchema': { type: 'string' }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/ItemSchema' }
                                }
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            const response = result.responses.get('200');
            expect(response?.schema?.constraints.items?.type).toBe('string');
        });

        it('should handle links with non-string parameters', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationId: 'otherOp',
                                parameters: {
                                    param1: 'value1',
                                    param2: 123,
                                    param3: { key: 'value' }
                                }
                            }
                        }
                    }
                }
            };
            testSpecDocument.paths['/other'] = {
                get: { operationId: 'otherOp', responses: {} }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            const link = result.links[0];
            expect(link.parameters?.param1).toBe('value1');
            expect(link.parameters?.param2).toBe('123');
            expect(link.parameters?.param3).toBe('{"key":"value"}');
        });

        it('should handle links with Ref', () => {
            testSpecDocument.components = {
                links: {
                    'RefLink': {
                        operationId: 'otherOp'
                    }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': { $ref: '#/components/links/RefLink' }
                        }
                    }
                }
            };
            testSpecDocument.paths['/other'] = {
                get: { operationId: 'otherOp', responses: {} }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.links).toHaveLength(1);
            expect(result.links[0].operationId).toBe('otherOp');
        });

        it('should handle callbacks with Ref', () => {
            testSpecDocument.components = {
                callbacks: {
                    'RefCallback': {
                        '{$request.body#/url}': {
                            post: { responses: {} }
                        }
                    }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                callbacks: {
                    'TestCallback': { $ref: '#/components/callbacks/RefCallback' }
                },
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toContainEqual(expect.objectContaining({
                relationship: 'callback',
                method: 'POST'
            }));
        });

        it('should handle path items with Ref in callbacks', () => {
            // This is tricky because PathItem Ref resolution is inside extractCallbackRelationships -> resolvePathItem
            // But resolvePathItem is private. We can trigger it via callbacks.
            // However, standard OpenAPI 3.0 doesn't support $ref in Path Item Object directly inside Callback Object values (which are Path Item Objects).
            // But the code supports it: resolvePathItem checks for $ref.
            // Let's try to construct a case where a callback expression points to a Ref.

            // Actually, the Callback Object is a map of expressions to Path Item Objects.
            // So: '{$request.body#/url}': { $ref: '#/components/pathItems/MyPath' } (if pathItems existed in components, but they don't in 3.0, maybe in 3.1?)
            // Or just a generic ref if the parser allows it.
            // Let's try mocking the ref resolver behavior or just constructing the object if types allow.

            // OpenAPIV3.CallbackObject is Record<string, PathItemObject | ReferenceObject>.
            // So yes, the value can be a ReferenceObject.

            // But wait, OpenAPIV3.CallbackObject definition:
            // export interface CallbackObject { [expression: string]: PathItemObject | ReferenceObject; }
            // So yes.

            // But wait, the code does:
            // for (const [expression, pathItem] of Object.entries(resolvedCallback))
            //   const resolvedPathItem = this.resolvePathItem(pathItem as any, document);

            // So if I have a callback where the value is a Ref, it should work.

            // But wait, `testSpecDocument.components` doesn't have `pathItems` in standard V3.
            // I can just put it somewhere and reference it, or mock the resolver.
            // Since I'm using the real RefResolver, I need a valid path in the document.
            // I can put it in `x-pathItems` or just rely on the fact that RefResolver resolves any JSON pointer.

            (testSpecDocument as any).customPathItems = {
                'MyPath': {
                    post: { responses: {} }
                }
            };

            const operation: OpenAPIV3.OperationObject = {
                callbacks: {
                    'TestCallback': {
                        '{$request.body#/url}': { $ref: '#/customPathItems/MyPath' }
                    }
                },
                responses: {}
            };

            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toContainEqual(expect.objectContaining({
                relationship: 'callback',
                method: 'POST'
            }));
        });

        it('should handle operationRef in links', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationRef: '#/paths/~1other/get'
                            }
                        }
                    }
                }
            };
            testSpecDocument.paths['/other'] = {
                get: { responses: {} }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toContainEqual(expect.objectContaining({
                relationship: 'link',
                path: '/other',
                method: 'GET'
            }));
        });

        it('should handle operationRef to webhooks', () => {
            (testSpecDocument as any).webhooks = {
                'myWebhook': {
                    post: { responses: {} }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationRef: '#/webhooks/myWebhook/post'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toContainEqual(expect.objectContaining({
                relationship: 'webhook',
                path: 'myWebhook',
                method: 'POST'
            }));
        });

        it('should return empty related endpoints if link target not found', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationId: 'nonExistent'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toEqual([]);
        });

        it('should return empty related endpoints if operationRef is invalid', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationRef: 'invalidRef'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toEqual([]);
        });

        it('should return empty related endpoints if operationRef points to non-path/webhook', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationRef: '#/components/schemas/SomeSchema'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toEqual([]);
        });

        it('should handle searchOperations with Ref in paths', () => {
            (testSpecDocument as any).customPathItems = {
                'MyPath': {
                    get: { operationId: 'foundIt', responses: {} }
                }
            };
            testSpecDocument.paths['/refPath'] = { $ref: '#/customPathItems/MyPath' };

            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationId: 'foundIt'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toContainEqual(expect.objectContaining({
                relationship: 'link',
                path: '/refPath',
                method: 'GET'
            }));
        });
    });

    describe('Coverage Gaps', () => {
        it('should handle undefined response object in analyzeResponses', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': undefined as any
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            // resolveResponse(undefined) returns { description: '' }
            // analyzeResponses uses that.
            const response = result.responses.get('200');
            expect(response).toBeDefined();
            expect(response?.description).toBe('');
        });

        it('should handle undefined link object in collectResponseLinks', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'BadLink': undefined as any
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            // resolveLink(undefined) returns null
            // collectResponseLinks checks if (!resolvedLink) continue
            expect(result.links).toHaveLength(0);
        });

        it('should handle undefined callback object in extractCallbackRelationships', () => {
            const operation: OpenAPIV3.OperationObject = {
                callbacks: {
                    'BadCallback': undefined as any
                },
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            // resolveCallback(undefined) returns undefined
            // extractCallbackRelationships checks if (!resolvedCallback) continue
            expect(result).toHaveLength(0);
        });

        it('should handle undefined pathItem in extractCallbackRelationships', () => {
            // This requires resolveCallback to return an object with undefined values
            // resolveCallback returns the callback object.
            // If callback object is { 'expression': undefined }

            const operation: OpenAPIV3.OperationObject = {
                callbacks: {
                    'TestCallback': {
                        '{$request.body#/url}': undefined as any
                    }
                },
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            // resolvePathItem(undefined) returns undefined
            // extractHttpMethods(undefined) returns []
            expect(result).toHaveLength(0);
        });

        it('should handle undefined parameters in normalizeLinkParameters', () => {
            // This is already covered by tests with links without parameters, but let's be explicit
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'LinkNoParams': {
                                operationId: 'opId'
                                // parameters undefined
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.links[0].parameters).toBeUndefined();
        });

        it('should handle operationRef with empty pointer', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationRef: '#/'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toHaveLength(0);
        });

        it('should handle undefined path item in searchOperations', () => {
            // Inject undefined path item
            (testSpecDocument.paths as any)['/bad'] = undefined;

            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationId: 'someOp'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toHaveLength(0);
        });

        it('should resolve operationId to webhook', () => {
            (testSpecDocument as any).webhooks = {
                'myWebhook': {
                    post: { operationId: 'webhookOp', responses: {} }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationId: 'webhookOp'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toContainEqual(expect.objectContaining({
                relationship: 'webhook',
                path: 'myWebhook',
                method: 'POST'
            }));
        });

        it('should handle operationRef with missing path or method', () => {
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'Link1': { operationRef: '#/paths/' },
                            'Link2': { operationRef: '#/paths/somePath' }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.findRelatedEndpoints(testSpec, endpoint);
            expect(result).toHaveLength(0);
        });

        it('should handle response as Ref', () => {
            testSpecDocument.components = {
                responses: {
                    'OkResponse': {
                        description: 'OK Ref',
                        content: {
                            'application/json': {
                                schema: { type: 'string' }
                            }
                        }
                    }
                }
            };
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': { $ref: '#/components/responses/OkResponse' }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            const response = result.responses.get('200');
            expect(response?.description).toBe('OK Ref');
            expect(response?.schema?.schema.type).toBe('string');
        });

        it('should handle document without paths in findOperationById', () => {
            const docWithoutPaths = { ...testSpecDocument };
            delete (docWithoutPaths as any).paths;

            // We need to trigger findOperationById.
            // It is called by resolveLinkTarget if link.operationId is present.
            const operation: OpenAPIV3.OperationObject = {
                responses: {
                    '200': {
                        description: 'OK',
                        links: {
                            'TestLink': {
                                operationId: 'someOp'
                            }
                        }
                    }
                }
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);

            // We need to inject the modified document into the analyzer or spec.
            // The analyzer takes the spec as argument.
            const specWithoutPaths = OpenAPISpecification.create(docWithoutPaths, 'test-source');

            const result = analyzer.findRelatedEndpoints(specWithoutPaths, endpoint);
            expect(result).toHaveLength(0);
        });

        it('should handle request body without content', () => {
            const operation: OpenAPIV3.OperationObject = {
                requestBody: {
                    required: true
                    // content is missing (invalid spec but possible in runtime)
                } as any,
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'POST', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.requestBody).toBeDefined();
            expect(result.requestBody?.contentType).toBe('application/json'); // Default
            expect(result.requestBody?.schema.schema.type).toBe('object'); // Fallback
        });

        it('should handle parameter with examples', () => {
            const operation: OpenAPIV3.OperationObject = {
                parameters: [{
                    name: 'test',
                    in: 'query',
                    examples: {
                        'example1': { value: 'foo' },
                        'example2': { value: 'bar' }
                    }
                }],
                responses: {}
            };
            const endpoint = Endpoint.create('/test', 'GET', operation);
            const result = analyzer.analyze(testSpec, endpoint);
            expect(result.parameters[0].schema.examples).toHaveLength(2);
        });
    });
});
