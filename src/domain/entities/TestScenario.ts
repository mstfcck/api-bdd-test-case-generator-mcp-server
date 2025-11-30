import { ScenarioType } from '../value-objects/index.js';

export type StepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';

export interface Step {
    keyword: StepKeyword;
    text: string;
    docString?: string;
    dataTable?: DataTable;
}

export interface DataTable {
    headers: string[];
    rows: string[][];
}

export interface ExamplesTable {
    headers: string[];
    rows: string[][];
}

export class TestScenario {
    private constructor(
        private readonly name: string,
        private readonly type: ScenarioType,
        private readonly steps: Step[],
        private readonly tags: string[],
        private readonly scenarioType: 'Scenario' | 'Scenario Outline',
        private readonly examples?: ExamplesTable,
        private readonly description?: string
    ) { }

    static createScenario(
        name: string,
        type: ScenarioType,
        steps: Step[],
        tags: string[] = [],
        description?: string
    ): TestScenario {
        return new TestScenario(name, type, steps, tags, 'Scenario', undefined, description);
    }

    static createScenarioOutline(
        name: string,
        type: ScenarioType,
        steps: Step[],
        examples: ExamplesTable,
        tags: string[] = [],
        description?: string
    ): TestScenario {
        return new TestScenario(name, type, steps, tags, 'Scenario Outline', examples, description);
    }

    getName(): string {
        return this.name;
    }

    getType(): ScenarioType {
        return this.type;
    }

    getSteps(): Step[] {
        return [...this.steps];
    }

    getTags(): string[] {
        return [...this.tags];
    }

    getScenarioType(): 'Scenario' | 'Scenario Outline' {
        return this.scenarioType;
    }

    getExamples(): ExamplesTable | undefined {
        return this.examples;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    isScenarioOutline(): boolean {
        return this.scenarioType === 'Scenario Outline';
    }

    getStepCount(): number {
        return this.steps.length;
    }

    getExampleCount(): number {
        return this.examples?.rows.length || 0;
    }

    hasTag(tag: string): boolean {
        return this.tags.includes(tag);
    }

    addTag(tag: string): TestScenario {
        if (this.hasTag(tag)) {
            return this;
        }
        return new TestScenario(
            this.name,
            this.type,
            this.steps,
            [...this.tags, tag],
            this.scenarioType,
            this.examples,
            this.description
        );
    }

    toJSON() {
        return {
            name: this.name,
            type: this.scenarioType,
            scenarioType: this.type,
            tags: this.tags,
            steps: this.steps,
            examples: this.examples,
            description: this.description,
            stepCount: this.getStepCount(),
            exampleCount: this.getExampleCount()
        };
    }
}
