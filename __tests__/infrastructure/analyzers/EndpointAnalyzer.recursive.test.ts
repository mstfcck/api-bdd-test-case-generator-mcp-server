import 'reflect-metadata';
import { EndpointAnalyzer } from '../../../src/infrastructure/analyzers/EndpointAnalyzer';
import { RefResolver } from '../../../src/infrastructure/analyzers/RefResolver';
import { Endpoint } from '../../../src/domain/entities/Endpoint';
import { OpenAPISpecification } from '../../../src/domain/entities/OpenAPISpecification';
import type { OpenAPIV3 } from 'openapi-types';

describe('EndpointAnalyzer Recursive Constraints', () => {
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
                '/complex': {
                    post: {
                        operationId: 'createComplex',
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            user: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string', minLength: 3 },
                                                    address: {
                                                        type: 'object',
                                                        properties: {
                                                            city: { type: 'string' },
                                                            zip: { type: 'string', pattern: '\\d{5}' }
                                                        }
                                                    }
                                                }
                                            },
                                            tags: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'integer' },
                                                        label: { type: 'string' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        responses: { '200': { description: 'OK' } }
                    }
                }
            }
        };

        testSpec = OpenAPISpecification.create(testSpecDocument, 'test-source');
    });

    it('should recursively extract constraints for nested objects', () => {
        const operation = testSpecDocument.paths['/complex']!.post!;
        const endpoint = Endpoint.create('/complex', 'POST', operation);

        const result = analyzer.analyze(testSpec, endpoint);
        const schema = result.requestBody!.schema;

        // Top level
        expect(schema.constraints.type).toBe('object');
        expect(schema.constraints.properties).toBeDefined();

        // Level 1: user
        const userConstraints = schema.constraints.properties!['user'];
        expect(userConstraints.type).toBe('object');
        expect(userConstraints.properties).toBeDefined();

        // Level 2: user.name
        const nameConstraints = userConstraints.properties!['name'];
        expect(nameConstraints.type).toBe('string');
        expect(nameConstraints.minLength).toBe(3);

        // Level 2: user.address
        const addressConstraints = userConstraints.properties!['address'];
        expect(addressConstraints.type).toBe('object');
        expect(addressConstraints.properties).toBeDefined();

        // Level 3: user.address.zip
        const zipConstraints = addressConstraints.properties!['zip'];
        expect(zipConstraints.type).toBe('string');
        expect(zipConstraints.pattern).toBe('\\d{5}');
    });

    it('should recursively extract constraints for array items', () => {
        const operation = testSpecDocument.paths['/complex']!.post!;
        const endpoint = Endpoint.create('/complex', 'POST', operation);

        const result = analyzer.analyze(testSpec, endpoint);
        const schema = result.requestBody!.schema;

        // Level 1: tags (array)
        const tagsConstraints = schema.constraints.properties!['tags'];
        expect(tagsConstraints.type).toBe('array');
        expect(tagsConstraints.items).toBeDefined();

        // Level 2: tags item
        const itemConstraints = tagsConstraints.items!;
        expect(itemConstraints.type).toBe('object');
        expect(itemConstraints.properties).toBeDefined();

        // Level 3: tags item properties
        const idConstraints = itemConstraints.properties!['id'];
        expect(idConstraints.type).toBe('integer');
    });
});
