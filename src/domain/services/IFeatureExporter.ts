import { FeatureFile, TestScenario } from '../entities/index.js';

export type ExportFormat = 'gherkin' | 'json' | 'markdown';

/**
 * Assembles test scenarios into a FeatureFile entity.
 * Single responsibility: feature composition.
 */
export interface IFeatureAssembler {
    assemble(
        scenarios: TestScenario[],
        endpoint: string,
        method: string,
        metadata: {
            openApiSpec: string;
            openApiVersion: string;
            operationId?: string;
        }
    ): FeatureFile;
}

/**
 * Serializes a FeatureFile entity to a specific output format.
 * Single responsibility: format rendering.
 */
export interface IFeatureSerializer {
    serialize(featureFile: FeatureFile, format: ExportFormat): string;
}
