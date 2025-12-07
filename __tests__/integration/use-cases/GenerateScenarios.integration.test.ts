import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../src/di/types';
import { GenerateScenariosUseCase } from '../../../src/application/use-cases/GenerateScenariosUseCase';
import { LoadSpecificationUseCase } from '../../../src/application/use-cases/LoadSpecificationUseCase';
import { AnalyzeEndpointUseCase } from '../../../src/application/use-cases/AnalyzeEndpointUseCase';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';
import { IStateRepository } from '../../../src/application/ports/IStateRepository';
import { createContainer } from '../../../src/di/container';
import * as path from 'path';

describe('GenerateScenariosUseCase Integration', () => {
    let container: Container;
    let generateUseCase: GenerateScenariosUseCase;
    let loadUseCase: LoadSpecificationUseCase;
    let analyzeUseCase: AnalyzeEndpointUseCase;
    let stateRepository: IStateRepository;
    let testSpecPath: string;

    beforeEach(async () => {
        container = createContainer();

        generateUseCase = container.get<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase);
        loadUseCase = container.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);
        analyzeUseCase = container.get<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase);
        stateRepository = container.get<IStateRepository>(TYPES.IStateRepository);

        testSpecPath = path.join(__dirname, '../../fixtures/petstore-simple.yaml');
        await loadUseCase.execute({ filePath: testSpecPath });
        await analyzeUseCase.execute({ path: '/pets', method: 'POST' });
    });

    describe('Generate scenarios', () => {
        it('should generate required fields scenario', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS]
            });

            expect(result.success).toBe(true);
            expect(result.scenarios).toBeDefined();
            expect(result.scenarios.length).toBeGreaterThan(0);

            const scenario = result.scenarios[0];
            expect(scenario.type).toBe(ScenarioType.REQUIRED_FIELDS);
            expect(scenario.stepCount).toBeGreaterThan(0);
        });

        it('should generate all fields scenario', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.ALL_FIELDS]
            });

            expect(result.success).toBe(true);
            expect(result.scenarios.length).toBeGreaterThan(0);

            const scenario = result.scenarios.find(s => s.type === ScenarioType.ALL_FIELDS);
            expect(scenario).toBeDefined();
        });

        it('should generate validation error scenario', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.VALIDATION_ERROR]
            });

            expect(result.success).toBe(true);
            const scenario = result.scenarios.find(s => s.type === ScenarioType.VALIDATION_ERROR);
            expect(scenario).toBeDefined();
        });

        it('should handle auth error scenario gracefully when no auth required', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.AUTH_ERROR]
            });

            // Should succeed even if no auth scenarios generated (endpoint has no auth)
            expect(result.success).toBe(true);
            expect(result.scenarios.length).toBeGreaterThanOrEqual(0);
        });

        it('should generate not found scenario', async () => {
            await analyzeUseCase.execute({ path: '/pets/{petId}', method: 'GET' });

            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.NOT_FOUND]
            });

            expect(result.success).toBe(true);
            const scenario = result.scenarios.find(s => s.type === ScenarioType.NOT_FOUND);
            expect(scenario).toBeDefined();
        });

        it('should generate edge case scenario', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.EDGE_CASE]
            });

            expect(result.success).toBe(true);
            const scenario = result.scenarios.find(s => s.type === ScenarioType.EDGE_CASE);
            expect(scenario).toBeDefined();
        });

        it('should generate multiple scenario types', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS, ScenarioType.ALL_FIELDS, ScenarioType.VALIDATION_ERROR]
            });

            expect(result.success).toBe(true);
            expect(result.scenarios.length).toBeGreaterThanOrEqual(3);
            expect(result.totalCount).toBe(result.scenarios.length);
        });

        it('should throw error when no endpoint is analyzed', async () => {
            const freshContainer = createContainer();
            const freshGenerateUseCase = freshContainer.get<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase);
            const freshLoadUseCase = freshContainer.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);

            await freshLoadUseCase.execute({ filePath: testSpecPath });

            await expect(freshGenerateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS]
            })).rejects.toThrow();
        });

        it('should handle empty scenario types array', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: []
            });

            expect(result.success).toBe(true);
            expect(result.scenarios).toEqual([]);
            expect(result.totalCount).toBe(0);
        });

        it('should generate all scenario types when scenarioTypes is undefined', async () => {
            const result = await generateUseCase.execute({});

            expect(result.success).toBe(true);
            expect(result.scenarios.length).toBeGreaterThan(0);

            const types = result.scenarios.map(s => s.type);
            expect(types).toContain(ScenarioType.REQUIRED_FIELDS);
            expect(types).toContain(ScenarioType.ALL_FIELDS);
        });

        it('should include scenario metadata', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS]
            });

            expect(result.success).toBe(true);
            const scenario = result.scenarios[0];
            expect(scenario.type).toBeDefined();
            expect(scenario.stepCount).toBeDefined();
        });

        it('should group scenarios by type', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS, ScenarioType.ALL_FIELDS]
            });

            expect(result.groupedByType).toBeDefined();
            expect(result.groupedByType[ScenarioType.REQUIRED_FIELDS]).toBeGreaterThan(0);
            expect(result.groupedByType[ScenarioType.ALL_FIELDS]).toBeGreaterThan(0);
        });

        it('should include scenario type in summary', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS]
            });

            expect(result.scenarios[0].scenarioType).toBeDefined();
        });

        it('should handle scenarios with examples', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.EDGE_CASE]
            });

            expect(result.success).toBe(true);
            const scenariosWithExamples = result.scenarios.filter(s => s.exampleCount && s.exampleCount > 0);
            expect(Array.isArray(scenariosWithExamples)).toBe(true);
        });

        it('should include tags in scenario summary', async () => {
            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS]
            });

            expect(result.scenarios[0].tags).toBeDefined();
            expect(Array.isArray(result.scenarios[0].tags)).toBe(true);
        });

        it('should generate all fields scenario for endpoint without request body', async () => {
            await analyzeUseCase.execute({ path: '/pets/{petId}', method: 'GET' });

            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.ALL_FIELDS]
            });

            expect(result.success).toBe(true);
            const scenarioSummary = result.scenarios.find(s => s.type === ScenarioType.ALL_FIELDS);
            expect(scenarioSummary).toBeDefined();

            // Verify steps from repository
            const savedScenarios = await stateRepository.getScenarios();
            const scenario = savedScenarios.find(s => s.getType() === ScenarioType.ALL_FIELDS);
            expect(scenario).toBeDefined();

            const whenStep = scenario?.getSteps().find(s => s.keyword === 'When');
            expect(whenStep?.docString).toBeUndefined();
        });

        it('should generate required fields scenario for endpoint without request body', async () => {
            await analyzeUseCase.execute({ path: '/pets/{petId}', method: 'GET' });

            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.REQUIRED_FIELDS]
            });

            expect(result.success).toBe(true);
            const scenarioSummary = result.scenarios.find(s => s.type === ScenarioType.REQUIRED_FIELDS);
            expect(scenarioSummary).toBeDefined();

            // Verify steps from repository
            const savedScenarios = await stateRepository.getScenarios();
            const scenario = savedScenarios.find(s => s.getType() === ScenarioType.REQUIRED_FIELDS);
            expect(scenario).toBeDefined();

            const whenStep = scenario?.getSteps().find(s => s.keyword === 'When');
            expect(whenStep?.docString).toBeUndefined();
        });

        it('should generate validation error scenario even when no request body', async () => {
            await analyzeUseCase.execute({ path: '/pets/{petId}', method: 'GET' });

            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.VALIDATION_ERROR]
            });

            expect(result.success).toBe(true);
            expect(result.scenarios.length).toBeGreaterThan(0);
            const scenarioSummary = result.scenarios.find(s => s.type === ScenarioType.VALIDATION_ERROR);
            expect(scenarioSummary).toBeDefined();

            // Verify steps from repository
            const savedScenarios = await stateRepository.getScenarios();
            const scenario = savedScenarios.find(s => s.getType() === ScenarioType.VALIDATION_ERROR);
            expect(scenario).toBeDefined();

            const whenStep = scenario?.getSteps().find(s => s.keyword === 'When');
            expect(whenStep?.docString).toBeUndefined();
        });

        it('should return empty scenarios for not found when no path parameters', async () => {
            // Re-analyze POST /pets which has no path parameters
            await analyzeUseCase.execute({ path: '/pets', method: 'POST' });

            const result = await generateUseCase.execute({
                scenarioTypes: [ScenarioType.NOT_FOUND]
            });

            expect(result.success).toBe(true);
            expect(result.scenarios).toEqual([]);
        });
    });
});