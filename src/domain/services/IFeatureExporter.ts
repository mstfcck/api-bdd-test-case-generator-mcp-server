import { FeatureFile, TestScenario } from '../entities/index.js';

export type ExportFormat = 'gherkin' | 'json' | 'markdown';

export interface IFeatureExporter {
    /**
     * Export scenarios to a feature file
     */
    exportFeature(
        scenarios: TestScenario[],
        endpoint: string,
        method: string,
        metadata: {
            openApiSpec: string;
            openApiVersion: string;
            operationId?: string;
        }
    ): FeatureFile;

    /**
     * Export feature file to a specific format
     */
    export(featureFile: FeatureFile, format: ExportFormat): string;
}
