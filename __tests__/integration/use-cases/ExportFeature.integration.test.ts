import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../src/di/types';
import { ExportFeatureUseCase } from '../../../src/application/use-cases/ExportFeatureUseCase';
import { LoadSpecificationUseCase } from '../../../src/application/use-cases/LoadSpecificationUseCase';
import { AnalyzeEndpointUseCase } from '../../../src/application/use-cases/AnalyzeEndpointUseCase';
import { GenerateScenariosUseCase } from '../../../src/application/use-cases/GenerateScenariosUseCase';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';
import { createContainer } from '../../../src/di/container';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('ExportFeatureUseCase Integration', () => {
    let container: Container;
    let exportUseCase: ExportFeatureUseCase;
    let loadUseCase: LoadSpecificationUseCase;
    let analyzeUseCase: AnalyzeEndpointUseCase;
    let generateUseCase: GenerateScenariosUseCase;
    let testSpecPath: string;
    let outputPath: string;

    beforeEach(async () => {
        container = createContainer();

        exportUseCase = container.get<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase);
        loadUseCase = container.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);
        analyzeUseCase = container.get<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase);
        generateUseCase = container.get<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase);

        testSpecPath = path.join(__dirname, '../../fixtures/petstore-simple.yaml');
        outputPath = path.join(__dirname, '../../fixtures/test-output.feature');

        await loadUseCase.execute({ filePath: testSpecPath });
        await analyzeUseCase.execute({ path: '/pets', method: 'POST' });
        await generateUseCase.execute({ scenarioTypes: [ScenarioType.REQUIRED_FIELDS, ScenarioType.ALL_FIELDS] });
    });

    afterEach(async () => {
        try {
            await fs.unlink(outputPath);
        } catch (err) {
            // Ignore if file doesn't exist
        }
    });

    describe('Export feature file', () => {
        it('should export feature file content', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            });

            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.content).toContain('Feature:');
            expect(result.content).toContain('Scenario:');
        });

        it('should include feature metadata', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            });

            expect(result.content).toContain('POST /pets');
            expect(result.stats.scenarioCount).toBeGreaterThan(0);
        });

        it('should write to file when outputPath provided', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true,
                outputPath: outputPath
            });

            expect(result.success).toBe(true);
            expect(result.filePath).toBe(outputPath);

            const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);

            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('Feature:');
        });

        it('should include multiple scenarios', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            });

            expect(result.stats.scenarioCount).toBeGreaterThanOrEqual(2);
            expect(result.content).toContain('Scenario:');
        });

        it('should format Gherkin correctly', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            });

            expect(result.content).toContain('Given');
            expect(result.content).toContain('When');
            expect(result.content).toContain('Then');
        });

        it('should throw error when no scenarios generated', async () => {
            const freshContainer = createContainer();
            const freshExportUseCase = freshContainer.get<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase);
            const freshLoadUseCase = freshContainer.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);

            await freshLoadUseCase.execute({ filePath: testSpecPath });

            await expect(freshExportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            })).rejects.toThrow();
        });

        it('should export JSON format', async () => {
            const result = await exportUseCase.execute({
                format: 'json',
                includeComments: false
            });

            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();

            const parsed = JSON.parse(result.content);
            expect(parsed).toHaveProperty('feature');
            expect(parsed).toHaveProperty('scenarios');
        });

        it('should export markdown format', async () => {
            const result = await exportUseCase.execute({
                format: 'markdown',
                includeComments: false
            });

            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.content).toContain('#');
        });

        it('should handle export without comments', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: false
            });

            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
        });

        it('should not write file when outputPath is undefined', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            });

            expect(result.filePath).toBeUndefined();
        });

        it('should include feature stats', async () => {
            const result = await exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            });

            expect(result.stats).toBeDefined();
            expect(result.stats.featureName).toBeDefined();
            expect(result.stats.scenarioCount).toBeGreaterThan(0);
            expect(result.stats.totalSteps).toBeGreaterThan(0);
            expect(result.stats.size).toBeGreaterThan(0);
        });

        it('should throw error when no endpoint context', async () => {
            const freshContainer = createContainer();
            const freshExportUseCase = freshContainer.get<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase);
            const freshLoadUseCase = freshContainer.get<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase);
            const freshGenerateUseCase = freshContainer.get<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase);

            await freshLoadUseCase.execute({ filePath: testSpecPath });

            // Try to export without analyzing endpoint first
            await expect(freshExportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            })).rejects.toThrow();
        });
        it('should throw error when scenarios exist but endpoint context is missing', async () => {
            // Scenarios are already generated in beforeEach

            // Manually clear endpoint context
            const stateRepo = container.get<any>(TYPES.IStateRepository);
            stateRepo.endpointContext = null;

            await expect(exportUseCase.execute({
                format: 'gherkin',
                includeComments: true
            })).rejects.toThrow('No endpoint context found');
        });
    });
});
