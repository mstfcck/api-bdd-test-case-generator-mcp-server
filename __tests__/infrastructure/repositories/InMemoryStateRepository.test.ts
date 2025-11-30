import 'reflect-metadata';
import { InMemoryStateRepository } from '../../../src/infrastructure/repositories/InMemoryStateRepository';

describe('InMemoryStateRepository', () => {
    let repository: InMemoryStateRepository;

    beforeEach(() => {
        repository = new InMemoryStateRepository();
    });

    describe('Endpoint context management', () => {
        it('should save and retrieve endpoint context', async () => {
            const context: any = {
                path: '/pets',
                method: 'POST',
                operationId: 'createPet'
            };

            await repository.saveEndpointContext(context);
            const retrieved = await repository.getEndpointContext();

            expect(retrieved).toBeDefined();
            expect(retrieved?.path).toBe('/pets');
            expect(retrieved?.method).toBe('POST');
        });

        it('should return null when no context is saved', async () => {
            const retrieved = await repository.getEndpointContext();
            expect(retrieved).toBeNull();
        });
    });

    describe('Scenarios management', () => {
        it('should save and retrieve scenarios', async () => {
            const scenarios: any[] = [
                { name: 'Test scenario 1' },
                { name: 'Test scenario 2' }
            ];

            await repository.saveScenarios(scenarios);
            const retrieved = await repository.getScenarios();

            expect(retrieved).toHaveLength(2);
        });

        it('should return empty array when no scenarios saved', async () => {
            const retrieved = await repository.getScenarios();
            expect(retrieved).toEqual([]);
        });
    });

    describe('Snapshot', () => {
        it('should return correct snapshot with data', async () => {
            await repository.saveEndpointContext({ path: '/test' } as any);
            await repository.saveScenarios([{ name: 'Test' }] as any);

            const snapshot = await repository.getSnapshot();

            expect(snapshot.hasEndpointContext).toBe(true);
            expect(snapshot.scenarioCount).toBe(1);
        });

        it('should return correct snapshot when empty', async () => {
            const snapshot = await repository.getSnapshot();

            expect(snapshot.hasEndpointContext).toBe(false);
            expect(snapshot.scenarioCount).toBe(0);
        });
    });

    describe('Clear state', () => {
        it('should clear all state', async () => {
            await repository.saveEndpointContext({ path: '/test' } as any);
            await repository.saveScenarios([{ name: 'Test' }] as any);
            await repository.clear();

            const retrievedContext = await repository.getEndpointContext();
            const retrievedScenarios = await repository.getScenarios();
            const snapshot = await repository.getSnapshot();

            expect(retrievedContext).toBeNull();
            expect(retrievedScenarios).toEqual([]);
            expect(snapshot.hasEndpointContext).toBe(false);
            expect(snapshot.scenarioCount).toBe(0);
        });
    });
});
