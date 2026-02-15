import 'reflect-metadata';
import { SpecificationAnalyzer } from '../../../src/infrastructure/analyzers/SpecificationAnalyzer';
import { ValidationError } from '../../../src/domain/errors/ValidationError';

describe('SpecificationAnalyzer', () => {
    let analyzer: SpecificationAnalyzer;

    const validSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Test API',
            version: '1.0.0'
        },
        paths: {
            '/test': {
                get: {
                    responses: {
                        '200': { description: 'OK' }
                    }
                }
            }
        }
    };

    beforeEach(() => {
        analyzer = new SpecificationAnalyzer();
    });

    describe('parse', () => {
        it('should parse YAML content', async () => {
            const yamlContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
`;

            const spec = await analyzer.parse(yamlContent, 'yaml');

            expect(spec).toBeDefined();
            expect(spec.getMetadata().title).toBe('Test API');
        });

        it('should parse JSON content', async () => {
            const jsonContent = JSON.stringify(validSpec);

            const spec = await analyzer.parse(jsonContent, 'json');

            expect(spec).toBeDefined();
            expect(spec.getMetadata().title).toBe('Test API');
        });

        it('should throw ValidationError for invalid JSON', async () => {
            const invalidJson = '{ invalid json }';

            await expect(analyzer.parse(invalidJson, 'json'))
                .rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid YAML', async () => {
            const invalidYaml = 'invalid: yaml: content: :::';

            await expect(analyzer.parse(invalidYaml, 'yaml'))
                .rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for missing openapi version', async () => {
            const invalidSpec = JSON.stringify({
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('Not a valid OpenAPI specification');
        });

        it('should throw ValidationError for unsupported openapi version', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '2.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('Unsupported OpenAPI version');
        });

        it('should accept OpenAPI 3.0.x versions', async () => {
            const spec30 = { ...validSpec, openapi: '3.0.3' };
            const content = JSON.stringify(spec30);

            const result = await analyzer.parse(content, 'json');

            expect(result).toBeDefined();
        });

        it('should accept OpenAPI 3.1.x versions', async () => {
            const spec31 = { ...validSpec, openapi: '3.1.0' };
            const content = JSON.stringify(spec31);

            const result = await analyzer.parse(content, 'json');

            expect(result).toBeDefined();
        });

        it('should accept swagger version (legacy)', async () => {
            const swaggerSpec = {
                swagger: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            };
            const content = JSON.stringify(swaggerSpec);

            const result = await analyzer.parse(content, 'json');

            expect(result).toBeDefined();
        });

        it('should throw ValidationError for missing paths', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' }
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('paths object is required');
        });

        it('should throw ValidationError for invalid paths type', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: 'invalid'
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('paths object is required');
        });

        it('should throw ValidationError for missing info.title', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { version: '1.0.0' },
                paths: {}
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('info.title and info.version are required');
        });

        it('should throw ValidationError for missing info.version', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test' },
                paths: {}
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('info.title and info.version are required');
        });

        it('should throw ValidationError for missing info object', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                paths: {}
            });

            await expect(analyzer.parse(invalidSpec, 'json'))
                .rejects.toThrow('info.title and info.version are required');
        });

        it('should throw ValidationError when parsed content is not an object', async () => {
            const invalidContent = '"just a string"';
            await expect(analyzer.parse(invalidContent, 'json'))
                .rejects.toThrow('Invalid specification: must be an object');
        });

        it('should throw ValidationError when parsed content is null', async () => {
            const invalidContent = 'null';
            await expect(analyzer.parse(invalidContent, 'json'))
                .rejects.toThrow('Invalid specification: must be an object');
        });
    });

    describe('validate', () => {
        it('should validate specification', async () => {
            const spec = await analyzer.parse(JSON.stringify(validSpec), 'json');

            expect(() => analyzer.validate(spec)).not.toThrow();
        });
    });
});
