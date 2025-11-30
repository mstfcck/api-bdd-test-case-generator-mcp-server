import { injectable } from 'inversify';
import { IFeatureExporter, type ExportFormat } from '../../domain/services/index.js';
import { FeatureFile, TestScenario, type FeatureInfo, type FeatureMetadata } from '../../domain/entities/index.js';

@injectable()
export class GherkinExporter implements IFeatureExporter {
    exportFeature(
        scenarios: TestScenario[],
        endpoint: string,
        method: string,
        metadata: {
            openApiSpec: string;
            openApiVersion: string;
            operationId?: string;
        }
    ): FeatureFile {
        const feature: FeatureInfo = {
            name: `${method.toUpperCase()} ${endpoint}`,
            description: `Test scenarios for ${method.toUpperCase()} ${endpoint} endpoint`,
            tags: ['@api', '@generated']
        };

        const featureMetadata: FeatureMetadata = {
            generatedAt: new Date(),
            openApiSpec: metadata.openApiSpec,
            openApiVersion: metadata.openApiVersion,
            endpoint,
            method: method.toUpperCase(),
            operationId: metadata.operationId
        };

        return FeatureFile.create(feature, scenarios, featureMetadata);
    }

    export(featureFile: FeatureFile, format: ExportFormat): string {
        switch (format) {
            case 'gherkin':
                return this.exportGherkin(featureFile);
            case 'json':
                return this.exportJSON(featureFile);
            case 'markdown':
                return this.exportMarkdown(featureFile);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private exportGherkin(featureFile: FeatureFile): string {
        const feature = featureFile.getFeature();
        const scenarios = featureFile.getScenarios();
        const metadata = featureFile.getMetadata();

        const lines: string[] = [];

        // Feature header
        if (feature.tags.length > 0) {
            lines.push(feature.tags.join(' '));
        }
        lines.push(`Feature: ${feature.name}`);
        if (feature.description) {
            lines.push(`  ${feature.description}`);
        }
        lines.push('');

        // Metadata as comments
        lines.push(`  # Generated: ${metadata.generatedAt.toISOString()}`);
        lines.push(`  # OpenAPI Spec: ${metadata.openApiSpec}`);
        lines.push(`  # OpenAPI Version: ${metadata.openApiVersion}`);
        if (metadata.operationId) {
            lines.push(`  # Operation ID: ${metadata.operationId}`);
        }
        lines.push('');

        // Scenarios
        for (const scenario of scenarios) {
            if (scenario.getTags().length > 0) {
                lines.push(`  ${scenario.getTags().join(' ')}`);
            }
            lines.push(`  ${scenario.getScenarioType()}: ${scenario.getName()}`);

            for (const step of scenario.getSteps()) {
                lines.push(`    ${step.keyword} ${step.text}`);
            }

            lines.push('');
        }

        return lines.join('\n');
    }

    private exportJSON(featureFile: FeatureFile): string {
        return JSON.stringify(featureFile.toJSON(), null, 2);
    }

    private exportMarkdown(featureFile: FeatureFile): string {
        const feature = featureFile.getFeature();
        const scenarios = featureFile.getScenarios();
        const metadata = featureFile.getMetadata();

        const lines: string[] = [];

        // Feature header
        lines.push(`# ${feature.name}`);
        lines.push('');
        if (feature.description) {
            lines.push(feature.description);
            lines.push('');
        }

        // Metadata
        lines.push('## Metadata');
        lines.push('');
        lines.push(`- **Generated**: ${metadata.generatedAt.toISOString()}`);
        lines.push(`- **OpenAPI Spec**: ${metadata.openApiSpec}`);
        lines.push(`- **OpenAPI Version**: ${metadata.openApiVersion}`);
        lines.push(`- **Endpoint**: ${metadata.method} ${metadata.endpoint}`);
        if (metadata.operationId) {
            lines.push(`- **Operation ID**: ${metadata.operationId}`);
        }
        lines.push('');

        // Scenarios
        lines.push('## Scenarios');
        lines.push('');

        for (const scenario of scenarios) {
            lines.push(`### ${scenario.getName()}`);
            lines.push('');
            if (scenario.getTags().length > 0) {
                lines.push(`**Tags**: ${scenario.getTags().join(', ')}`);
                lines.push('');
            }

            for (const step of scenario.getSteps()) {
                lines.push(`- **${step.keyword}** ${step.text}`);
            }

            lines.push('');
        }

        return lines.join('\n');
    }
}
