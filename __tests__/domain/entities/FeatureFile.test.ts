import 'reflect-metadata';
import { FeatureFile } from '../../../src/domain/entities/FeatureFile';
import { TestScenario } from '../../../src/domain/entities/TestScenario';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';

describe('FeatureFile', () => {
    describe('create', () => {
        it('should create feature file with scenarios', () => {
            const feature = {
                name: 'POST /pets',
                description: 'Test scenarios',
                tags: ['@api']
            };

            const scenarios: any[] = [];
            const metadata = {
                generatedAt: new Date(),
                openApiSpec: 'petstore',
                openApiVersion: '3.0.0',
                endpoint: '/pets',
                method: 'POST'
            };

            const featureFile = FeatureFile.create(feature, scenarios, metadata);

            expect(featureFile.getFeature().name).toBe('POST /pets');
            expect(featureFile.getScenarios()).toHaveLength(0);
        });

        it('should create feature file with operationId', () => {
            const feature = {
                name: 'POST /pets',
                description: 'Test scenarios',
                tags: ['@api']
            };

            const scenarios: any[] = [];
            const metadata = {
                generatedAt: new Date(),
                openApiSpec: 'petstore',
                openApiVersion: '3.0.0',
                endpoint: '/pets',
                method: 'POST',
                operationId: 'createPet'
            };

            const featureFile = FeatureFile.create(feature, scenarios, metadata);

            expect(featureFile.getMetadata().operationId).toBe('createPet');
        });
    });

    describe('getters', () => {
        it('should get feature info', () => {
            const feature = {
                name: 'Test Feature',
                description: 'Description',
                tags: ['@test']
            };

            const featureFile = FeatureFile.create(
                feature,
                [],
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                }
            );

            const info = featureFile.getFeature();
            expect(info.name).toBe('Test Feature');
            expect(info.description).toBe('Description');
            expect(info.tags).toEqual(['@test']);
        });

        it('should get scenarios', () => {
            const scenarios: any[] = [];

            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                scenarios,
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                }
            );

            expect(featureFile.getScenarios()).toEqual([]);
        });

        it('should get metadata', () => {
            const metadata = {
                generatedAt: new Date('2024-01-01'),
                openApiSpec: 'petstore',
                openApiVersion: '3.0.0',
                endpoint: '/pets',
                method: 'POST'
            };

            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                [],
                metadata
            );

            const meta = featureFile.getMetadata();
            expect(meta.openApiSpec).toBe('petstore');
            expect(meta.endpoint).toBe('/pets');
            expect(meta.method).toBe('POST');
        });
    });

    describe('statistics', () => {
        it('should count total scenarios', () => {
            const scenarios: any[] = [];

            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                scenarios,
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                }
            );

            expect(featureFile.getScenarioCount()).toBe(0);
        });

        it('should count total steps', () => {
            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                [],
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                }
            );

            expect(featureFile.getTotalStepCount()).toBe(0);
        });

        it('should filter scenarios by type', () => {
            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                [],
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                }
            );

            expect(featureFile.getScenariosByType('Scenario')).toEqual([]);
        });

        it('should check if has background', () => {
            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                [],
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                }
            );

            expect(featureFile.hasBackground()).toBe(false);
        });

        it('should have background when provided', () => {
            const background = {
                steps: [
                    { keyword: 'Given' as const, text: 'a precondition' }
                ]
            };

            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                [],
                {
                    generatedAt: new Date(),
                    openApiSpec: 'spec',
                    openApiVersion: '3.0.0',
                    endpoint: '/test',
                    method: 'GET'
                },
                background
            );

            expect(featureFile.hasBackground()).toBe(true);
            expect(featureFile.getBackground()).toBeDefined();
        });
    });

    describe('toJSON', () => {
        it('should serialize to JSON', () => {
            const feature = {
                name: 'POST /pets',
                description: 'Test',
                tags: ['@api']
            };

            const metadata = {
                generatedAt: new Date('2024-01-01'),
                openApiSpec: 'petstore',
                openApiVersion: '3.0.0',
                endpoint: '/pets',
                method: 'POST',
                operationId: 'createPet'
            };

            const featureFile = FeatureFile.create(feature, [], metadata);
            const json = featureFile.toJSON();

            expect(json.feature.name).toBe('POST /pets');
            expect(json.metadata.openApiSpec).toBe('petstore');
            expect(json.metadata.operationId).toBe('createPet');
            expect(json.scenarios).toEqual([]);
        });

        it('should serialize without operationId', () => {
            const metadata = {
                generatedAt: new Date('2024-01-01'),
                openApiSpec: 'petstore',
                openApiVersion: '3.0.0',
                endpoint: '/pets',
                method: 'POST'
            };

            const featureFile = FeatureFile.create(
                { name: 'Test', description: '', tags: [] },
                [],
                metadata
            );

            const json = featureFile.toJSON();
            expect(json.metadata.operationId).toBeUndefined();
        });
    });
});
