import { TestScenario } from './TestScenario.js';

export interface FeatureInfo {
    name: string;
    description: string;
    tags: string[];
}

export interface FeatureMetadata {
    generatedAt: Date;
    openApiSpec: string;
    openApiVersion: string;
    endpoint: string;
    method: string;
    operationId?: string;
}

export interface BackgroundSection {
    steps: Array<{
        keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
        text: string;
    }>;
}

export class FeatureFile {
    private constructor(
        private readonly feature: FeatureInfo,
        private readonly scenarios: TestScenario[],
        private readonly metadata: FeatureMetadata,
        private readonly background?: BackgroundSection
    ) { }

    static create(
        feature: FeatureInfo,
        scenarios: TestScenario[],
        metadata: FeatureMetadata,
        background?: BackgroundSection
    ): FeatureFile {
        return new FeatureFile(feature, scenarios, metadata, background);
    }

    getFeature(): FeatureInfo {
        return this.feature;
    }

    getScenarios(): TestScenario[] {
        return [...this.scenarios];
    }

    getMetadata(): FeatureMetadata {
        return this.metadata;
    }

    getBackground(): BackgroundSection | undefined {
        return this.background;
    }

    getScenarioCount(): number {
        return this.scenarios.length;
    }

    getTotalStepCount(): number {
        return this.scenarios.reduce((total, scenario) => total + scenario.getStepCount(), 0);
    }

    getScenariosByType(type: string): TestScenario[] {
        return this.scenarios.filter(s => s.getType() === type);
    }

    hasBackground(): boolean {
        return !!this.background;
    }

    toJSON() {
        return {
            feature: this.feature,
            background: this.background,
            scenarios: this.scenarios.map(s => s.toJSON()),
            metadata: {
                ...this.metadata,
                generatedAt: this.metadata.generatedAt.toISOString()
            },
            stats: {
                scenarioCount: this.getScenarioCount(),
                totalSteps: this.getTotalStepCount()
            }
        };
    }
}
