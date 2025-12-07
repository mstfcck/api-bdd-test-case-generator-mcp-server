import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../src/di/types';
import { LoadSpecificationUseCase } from '../../../src/application/use-cases/LoadSpecificationUseCase';
import { ISpecificationRepository } from '../../../src/application/ports/ISpecificationRepository';
import { IFileSystem } from '../../../src/application/ports/IFileSystem';
import { createContainer } from '../../../src/di/container';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('LoadSpecificationUseCase Integration', () => {
    let container: Container;
    let useCase: LoadSpecificationUseCase;
    let specRepository: ISpecificationRepository;
    let fileSystem: IFileSystem;
    let testSpecPath: string;

    beforeEach(async () => {
        container = createContainer();

        useCase = container.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);
        specRepository = container.get<ISpecificationRepository>(TYPES.ISpecificationRepository);
        fileSystem = container.get<IFileSystem>(TYPES.IFileSystem);

        testSpecPath = path.join(__dirname, '../../fixtures/petstore-simple.yaml');
    });

    describe('Load from file', () => {
        it('should load specification from file path', async () => {
            const result = await useCase.execute({
                filePath: testSpecPath
            });

            expect(result.success).toBe(true);
            expect(result.specification).toBeDefined();
            expect(result.specification.title).toBe('Simple Pet Store API');
            expect(result.specification.version).toBe('1.0.0');
            expect(result.specification.openApiVersion).toBe('3.0.0');
            expect(result.source).toContain('petstore-simple.yaml');
        });

        it('should throw error for non-existent file', async () => {
            await expect(useCase.execute({
                filePath: '/non/existent/file.yaml'
            })).rejects.toThrow();
        });
    });

    describe('Load from content', () => {
        it('should load specification from content string', async () => {
            const content = await fs.readFile(testSpecPath, 'utf-8');

            const result = await useCase.execute({
                content: content
            });

            expect(result.success).toBe(true);
            expect(result.specification).toBeDefined();
            expect(result.specification.title).toBe('Simple Pet Store API');
            expect(result.source).toBe('content');
        });

        it('should throw error for invalid YAML content', async () => {
            await expect(useCase.execute({
                content: 'invalid: yaml: content: :::'
            })).rejects.toThrow();
        });

        it('should throw error for non-OpenAPI content', async () => {
            await expect(useCase.execute({
                content: 'valid: yaml\nbut: not\nopenapi: spec'
            })).rejects.toThrow();
        });
    });

    describe('Validation', () => {
        it('should throw error when both file path and content are missing', async () => {
            await expect(useCase.execute({}))
                .rejects.toThrow();
        });

        it('should include loadedAt timestamp', async () => {
            const result = await useCase.execute({
                filePath: testSpecPath
            });

            expect(result.loadedAt).toBeInstanceOf(Date);
            expect(result.loadedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        it('should save specification to repository', async () => {
            await useCase.execute({
                filePath: testSpecPath
            });

            const savedSpec = await specRepository.get();
            expect(savedSpec).toBeDefined();
            expect(savedSpec?.getMetadata().title).toBe('Simple Pet Store API');
        });

        it('should handle JSON format content', async () => {
            const yamlContent = await fs.readFile(testSpecPath, 'utf-8');

            const result = await useCase.execute({
                content: yamlContent,
                format: 'yaml'
            });

            expect(result.success).toBe(true);
        });

        it('should handle JSON content with explicit format', async () => {
            const jsonSpec = JSON.stringify({
                openapi: '3.0.0',
                info: {
                    title: 'JSON API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            summary: 'Test endpoint',
                            responses: {
                                '200': {
                                    description: 'OK'
                                }
                            }
                        }
                    }
                }
            });

            const result = await useCase.execute({
                content: jsonSpec,
                format: 'json'
            });

            expect(result.success).toBe(true);
            expect(result.specification.title).toBe('JSON API');
        });

        it('should include path count in response', async () => {
            const result = await useCase.execute({
                filePath: testSpecPath
            });

            expect(result.specification.pathCount).toBeGreaterThan(0);
        });

        it('should include servers in response', async () => {
            const result = await useCase.execute({
                filePath: testSpecPath
            });

            expect(result.specification.servers).toBeDefined();
            expect(Array.isArray(result.specification.servers)).toBe(true);
        });
    });
});
