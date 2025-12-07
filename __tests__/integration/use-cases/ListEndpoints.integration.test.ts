import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../src/di/types';
import { ListEndpointsUseCase } from '../../../src/application/use-cases/ListEndpointsUseCase';
import { LoadSpecificationUseCase } from '../../../src/application/use-cases/LoadSpecificationUseCase';
import { createContainer } from '../../../src/di/container';
import * as path from 'path';

describe('ListEndpointsUseCase Integration', () => {
    let container: Container;
    let listUseCase: ListEndpointsUseCase;
    let loadUseCase: LoadSpecificationUseCase;
    let testSpecPath: string;

    beforeEach(async () => {
        container = createContainer();

        listUseCase = container.get<ListEndpointsUseCase>(TYPES.ListEndpointsUseCase);
        loadUseCase = container.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);

        testSpecPath = path.join(__dirname, '../../fixtures/petstore-simple.yaml');
    });

    describe('List endpoints', () => {
        it('should list all endpoints from loaded specification', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({});

            expect(result.success).toBe(true);
            expect(result.endpoints).toBeDefined();
            expect(result.endpoints.length).toBe(3);

            const paths = result.endpoints.map(e => e.path);
            expect(paths).toContain('/pets');
            expect(paths).toContain('/pets/{petId}');

            const getPets = result.endpoints.find(e => e.path === '/pets' && e.method === 'GET');
            expect(getPets).toBeDefined();
            expect(getPets?.summary).toBe('List all pets');
            expect(getPets?.operationId).toBe('listPets');

            const postPets = result.endpoints.find(e => e.path === '/pets' && e.method === 'POST');
            expect(postPets).toBeDefined();
            expect(postPets?.summary).toBe('Create a pet');
            expect(postPets?.operationId).toBe('createPet');

            const getPetById = result.endpoints.find(e => e.path === '/pets/{petId}');
            expect(getPetById).toBeDefined();
            expect(getPetById?.summary).toBe('Info for a specific pet');
            expect(getPetById?.operationId).toBe('showPetById');
        });

        it('should filter endpoints by path', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: { path: '/pets/{petId}' }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBe(1);
            expect(result.endpoints[0].path).toBe('/pets/{petId}');
        });

        it('should filter endpoints by method', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: { method: 'POST' }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBe(1);
            expect(result.endpoints[0].method).toBe('POST');
            expect(result.endpoints[0].path).toBe('/pets');
        });

        it('should throw error when no specification is loaded', async () => {
            await expect(listUseCase.execute({}))
                .rejects.toThrow('No specification loaded');
        });

        it('should filter endpoints by tag', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: { tag: 'pets' }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBeGreaterThan(0);
            result.endpoints.forEach(endpoint => {
                expect(endpoint.tags).toContain('pets');
            });
        });

        it('should return totalCount', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({});

            expect(result.totalCount).toBe(result.endpoints.length);
            expect(result.totalCount).toBe(3);
        });

        it('should group endpoints by tag', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({});

            expect(result.groupedByTag).toBeDefined();
            expect(typeof result.groupedByTag).toBe('object');

            if (result.groupedByTag && Object.keys(result.groupedByTag).length > 0) {
                const firstTag = Object.keys(result.groupedByTag)[0];
                expect(Array.isArray(result.groupedByTag[firstTag])).toBe(true);
            }
        });

        it('should filter by partial path match', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: { path: 'pets' }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBe(3);
            result.endpoints.forEach(endpoint => {
                expect(endpoint.path).toContain('pets');
            });
        });

        it('should combine multiple filters', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: {
                    method: 'GET',
                    path: '/pets'
                }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBeGreaterThan(0);
            result.endpoints.forEach(endpoint => {
                expect(endpoint.method).toBe('GET');
                expect(endpoint.path).toContain('/pets');
            });
        });

        it('should return empty array when no endpoints match filter', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: { method: 'PATCH' }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints).toEqual([]);
            expect(result.totalCount).toBe(0);
        });

        it('should return empty array when filtering by non-existent tag', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: { tag: 'non-existent-tag' }
            });

            expect(result.success).toBe(true);
            expect(result.endpoints).toEqual([]);
            expect(result.totalCount).toBe(0);
        });

        it('should include endpoint metadata', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({});

            expect(result.endpoints[0]).toHaveProperty('path');
            expect(result.endpoints[0]).toHaveProperty('method');
            expect(result.endpoints[0]).toHaveProperty('operationId');
            expect(result.endpoints[0]).toHaveProperty('summary');
            expect(result.endpoints[0]).toHaveProperty('tags');
        });

        it('should skip invalid/null path items', async () => {
            const invalidSpec = `
openapi: 3.0.0
info:
  title: Invalid Path Spec
  version: 1.0.0
paths:
  /valid:
    get:
      operationId: validOp
      responses:
        '200':
          description: ok
  /invalid: null
`;
            await loadUseCase.execute({ content: invalidSpec, format: 'yaml' });
            const result = await listUseCase.execute({});
            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBe(1);
            expect(result.endpoints[0].path).toBe('/valid');
        });

        it('should handle empty filter object', async () => {
            await loadUseCase.execute({ filePath: testSpecPath });

            const result = await listUseCase.execute({
                filter: {}
            });

            expect(result.success).toBe(true);
            expect(result.endpoints.length).toBe(3);
        });
    });
});
