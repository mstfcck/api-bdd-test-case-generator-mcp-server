import { IScenarioGenerator, type EndpointAnalysis } from '../../domain/services/index.js';
import { TestScenario, type Step, type StepKeyword } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';

export abstract class BaseScenarioGenerator implements IScenarioGenerator {
    abstract getType(): ScenarioType;
    abstract generate(analysis: EndpointAnalysis): TestScenario[];

    canGenerate(analysis: EndpointAnalysis): boolean {
        return true;
    }

    protected createScenario(
        name: string,
        type: ScenarioType,
        steps: Step[],
        tags: string[] = []
    ): TestScenario {
        return TestScenario.createScenario(name, type, steps, tags);
    }

    protected given(text: string): Step {
        return { keyword: 'Given', text };
    }

    protected when(text: string): Step {
        return { keyword: 'When', text };
    }

    protected then(text: string): Step {
        return { keyword: 'Then', text };
    }

    protected and(text: string): Step {
        return { keyword: 'And', text };
    }

    protected but(text: string): Step {
        return { keyword: 'But', text };
    }

    protected formatEndpoint(analysis: EndpointAnalysis): string {
        return `${analysis.method.toUpperCase()} ${analysis.path}`;
    }
}
