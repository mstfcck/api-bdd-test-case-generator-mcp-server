import 'reflect-metadata';
import { SpecificationAnalyzer } from '../../../src/infrastructure/analyzers/SpecificationAnalyzer';
import { IFileSystem } from '../../../src/application/ports/IFileSystem';
import { ValidationError } from '../../../src/domain/errors/ValidationError';
import type { OpenAPIV3 } from 'openapi-types';

describe('SpecificationAnalyzer', () => {
    let analyzer: SpecificationAnalyzer;
    let mockFileSystem: jest.Mocked<IFileSystem>;

    const validSpec: OpenAPIV3.Document = {
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
        mockFileSystem = {
            readFile: jest.fn(),
            writeFile: jest.fn(),
            exists: jest.fn()
        } as any;

        analyzer = new SpecificationAnalyzer(mockFileSystem);
    });

    describe('loadFromFile', () => {
        it('should load YAML file successfully', async () => {
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
            mockFileSystem.readFile.mockResolvedValue(yamlContent);

            const spec = await analyzer.loadFromFile('/path/to/spec.yaml');

            expect(spec).toBeDefined();
            expect(spec.getMetadata().title).toBe('Test API');
            expect(mockFileSystem.readFile).toHaveBeenCalledWith('/path/to/spec.yaml');
        });

        it('should load JSON file successfully', async () => {
            const jsonContent = JSON.stringify(validSpec);
            mockFileSystem.readFile.mockResolvedValue(jsonContent);

            const spec = await analyzer.loadFromFile('/path/to/spec.json');

            expect(spec).toBeDefined();
            expect(spec.getMetadata().title).toBe('Test API');
        });

        it('should detect format from file extension', async () => {
            const jsonContent = JSON.stringify(validSpec);
            mockFileSystem.readFile.mockResolvedValue(jsonContent);

            await analyzer.loadFromFile('/path/to/spec.json');

            expect(mockFileSystem.readFile).toHaveBeenCalledWith('/path/to/spec.json');
        });
    });

    describe('loadFromContent', () => {
        it('should load from YAML content', async () => {
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

            const spec = await analyzer.loadFromContent(yamlContent, 'yaml');

            expect(spec).toBeDefined();
            expect(spec.getMetadata().title).toBe('Test API');
        });

        it('should load from JSON content', async () => {
            const jsonContent = JSON.stringify(validSpec);

            const spec = await analyzer.loadFromContent(jsonContent, 'json');

            expect(spec).toBeDefined();
            expect(spec.getMetadata().title).toBe('Test API');
        });

        it('should throw ValidationError for invalid JSON', async () => {
            const invalidJson = '{ invalid json }';

            await expect(analyzer.loadFromContent(invalidJson, 'json'))
                .rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid YAML', async () => {
            const invalidYaml = 'invalid: yaml: content: :::';

            await expect(analyzer.loadFromContent(invalidYaml, 'yaml'))
                .rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for missing openapi version', async () => {
            const invalidSpec = JSON.stringify({
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('Not a valid OpenAPI specification');
        });

        it('should throw ValidationError for unsupported openapi version', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '2.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('Unsupported OpenAPI version');
        });

        it('should accept OpenAPI 3.0.x versions', async () => {
            const spec30 = { ...validSpec, openapi: '3.0.3' };
            const content = JSON.stringify(spec30);

            const result = await analyzer.loadFromContent(content, 'json');

            expect(result).toBeDefined();
        });

        it('should accept OpenAPI 3.1.x versions', async () => {
            const spec31 = { ...validSpec, openapi: '3.1.0' };
            const content = JSON.stringify(spec31);

            const result = await analyzer.loadFromContent(content, 'json');

            expect(result).toBeDefined();
        });

        it('should accept swagger version (legacy)', async () => {
            const swaggerSpec = {
                swagger: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            };
            const content = JSON.stringify(swaggerSpec);

            const result = await analyzer.loadFromContent(content, 'json');

            expect(result).toBeDefined();
        });

        it('should throw ValidationError for missing paths', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' }
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('paths object is required');
        });

        it('should throw ValidationError for invalid paths type', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: 'invalid'
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('paths object is required');
        });

        it('should throw ValidationError for missing info.title', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { version: '1.0.0' },
                paths: {}
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('info.title and info.version are required');
        });

        it('should throw ValidationError for missing info.version', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                info: { title: 'Test' },
                paths: {}
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('info.title and info.version are required');
        });

        it('should throw ValidationError for missing info object', async () => {
            const invalidSpec = JSON.stringify({
                openapi: '3.0.0',
                paths: {}
            });

            await expect(analyzer.loadFromContent(invalidSpec, 'json'))
                .rejects.toThrow('info.title and info.version are required');
        });
    });

    describe('validate', () => {
        it('should validate specification', async () => {
            const spec = await analyzer.loadFromContent(JSON.stringify(validSpec), 'json');

            expect(() => analyzer.validate(spec)).not.toThrow();
        });
    });
});
