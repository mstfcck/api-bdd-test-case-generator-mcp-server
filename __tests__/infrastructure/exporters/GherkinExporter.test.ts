import 'reflect-metadata';
import { GherkinExporter } from '../../../src/infrastructure/exporters/GherkinExporter';
import { TestScenario } from '../../../src/domain/entities/TestScenario';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';

describe('GherkinExporter', () => {
    let exporter: GherkinExporter;

    beforeEach(() => {
        exporter = new GherkinExporter();
    });

    describe('exportFeature', () => {
        it('should create FeatureFile with basic metadata', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            expect(featureFile).toBeDefined();
            const feature = featureFile.getFeature();
            expect(feature.name).toBe('POST /pets');
            expect(feature.description).toContain('POST /pets endpoint');
        });

        it('should include operationId when provided', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0',
                operationId: 'createPet'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const featureMetadata = featureFile.getMetadata();
            expect(featureMetadata.operationId).toBe('createPet');
        });

        it('should uppercase method in feature name', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'get',
                metadata
            );

            const feature = featureFile.getFeature();
            expect(feature.name).toBe('GET /pets');
        });
    });

    describe('export - Gherkin format', () => {
        it('should export feature in Gherkin format', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'gherkin');

            expect(output).toContain('Feature: POST /pets');
            expect(output).toContain('@api');
            expect(output).toContain('@generated');
            expect(output).toContain('# OpenAPI Spec: petstore-api');
            expect(output).toContain('# OpenAPI Version: 3.0.0');
        });

        it('should include operationId comment when present', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0',
                operationId: 'createPet'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'gherkin');

            expect(output).toContain('# Operation ID: createPet');
        });

        it('should not include operationId comment when missing', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'gherkin');

            expect(output).not.toContain('# Operation ID:');
        });
    });

    describe('export - JSON format', () => {
        it('should export feature in JSON format', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'json');

            const parsed = JSON.parse(output);
            expect(parsed.feature.name).toBe('POST /pets');
            expect(parsed.metadata.openApiSpec).toBe('petstore-api');
        });

        it('should pretty print JSON with 2 space indentation', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'json');

            expect(output).toContain('  "feature"');
            expect(output).toContain('  "metadata"');
        });
    });

    describe('export - Markdown format', () => {
        it('should export feature in Markdown format', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'markdown');

            expect(output).toContain('# POST /pets');
            expect(output).toContain('## Metadata');
            expect(output).toContain('- **OpenAPI Spec**: petstore-api');
            expect(output).toContain('- **Endpoint**: POST /pets');
        });

        it('should include operationId in markdown when present', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0',
                operationId: 'createPet'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'markdown');

            expect(output).toContain('- **Operation ID**: createPet');
        });

        it('should not include operationId in markdown when missing', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'markdown');

            expect(output).not.toContain('- **Operation ID**:');
        });

        it('should include feature description when present', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            const output = exporter.export(featureFile, 'markdown');

            expect(output).toContain('Test scenarios for POST /pets endpoint');
        });
    });

    describe('export - Unsupported format', () => {
        it('should throw error for unsupported format', () => {
            const scenarios: any[] = [];
            const metadata = {
                openApiSpec: 'petstore-api',
                openApiVersion: '3.0.0'
            };

            const featureFile = exporter.exportFeature(
                scenarios,
                '/pets',
                'post',
                metadata
            );

            expect(() => exporter.export(featureFile, 'xml' as any))
                .toThrow('Unsupported format: xml');
        });
    });
});
