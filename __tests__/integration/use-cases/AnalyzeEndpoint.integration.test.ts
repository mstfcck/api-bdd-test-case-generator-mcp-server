import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../src/di/types';
import { AnalyzeEndpointUseCase } from '../../../src/application/use-cases/AnalyzeEndpointUseCase';
import { LoadSpecificationUseCase } from '../../../src/application/use-cases/LoadSpecificationUseCase';
import { createContainer } from '../../../src/di/container';
import * as path from 'path';

describe('AnalyzeEndpointUseCase Integration', () => {
    let container: Container;
    let analyzeUseCase: AnalyzeEndpointUseCase;
    let loadUseCase: LoadSpecificationUseCase;
    let testSpecPath: string;

    beforeEach(async () => {
        container = createContainer();

        analyzeUseCase = container.get<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase);
        loadUseCase = container.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);

        testSpecPath = path.join(__dirname, '../../fixtures/petstore-simple.yaml');
        await loadUseCase.execute({ filePath: testSpecPath });
    });

    describe('Analyze endpoint', () => {
        it('should analyze POST /pets endpoint', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'POST'
            });

            expect(result.success).toBe(true);
            expect(result.analysis).toBeDefined();
            expect(result.analysis.path).toBe('/pets');
            expect(result.analysis.method).toBe('POST');
            expect(result.analysis.operationId).toBe('createPet');
            expect(result.analysis.summary).toBe('Create a pet');
            expect(result.insights.hasRequestBody).toBe(true);
        });

        it('should analyze GET /pets endpoint', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'GET'
            });

            expect(result.success).toBe(true);
            expect(result.analysis.operationId).toBe('listPets');
            expect(result.insights.hasQueryParameters).toBe(true);
        });

        it('should analyze GET /pets/{petId} endpoint', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets/{petId}',
                method: 'GET'
            });

            expect(result.success).toBe(true);
            expect(result.analysis.operationId).toBe('showPetById');
            expect(result.insights.hasPathParameters).toBe(true);
        });

        it('should include response count', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'POST'
            });

            expect(result.insights.responseCount).toBeGreaterThan(0);
        });

        it('should throw error for non-existent endpoint', async () => {
            await expect(analyzeUseCase.execute({
                path: '/non-existent',
                method: 'GET'
            })).rejects.toThrow();
        });

        it('should throw error for wrong method on existing path', async () => {
            await expect(analyzeUseCase.execute({
                path: '/pets',
                method: 'DELETE'
            })).rejects.toThrow();
        });

        it('should detect authentication requirements', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'POST'
            });

            expect(result.insights.hasAuthentication).toBeDefined();
        });

        it('should count related endpoints', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'GET'
            });

            expect(result.insights.relatedEndpointCount).toBeDefined();
            expect(result.insights.relatedEndpointCount).toBeGreaterThanOrEqual(0);
        });

        it('should handle endpoints with query parameters', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'GET'
            });

            expect(result.insights.hasQueryParameters).toBe(true);
        });

        it('should handle endpoints without query parameters', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'POST'
            });

            expect(result.insights.hasQueryParameters).toBeDefined();
        });

        it('should handle endpoints with path parameters', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets/{petId}',
                method: 'GET'
            });

            expect(result.insights.hasPathParameters).toBe(true);
        });

        it('should handle endpoints without path parameters', async () => {
            const result = await analyzeUseCase.execute({
                path: '/pets',
                method: 'GET'
            });

            expect(result.insights.hasPathParameters).toBe(false);
        });
    });
});
