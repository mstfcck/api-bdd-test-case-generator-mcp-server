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

    protected createGiven(text: string, docString?: string): Step {
        return { keyword: 'Given', text, docString };
    }

    protected createWhen(text: string, docString?: string): Step {
        return { keyword: 'When', text, docString };
    }

    protected createThen(text: string, docString?: string): Step {
        return { keyword: 'Then', text, docString };
    }

    protected createAnd(text: string, docString?: string): Step {
        return { keyword: 'And', text, docString };
    }

    protected createBut(text: string, docString?: string): Step {
        return { keyword: 'But', text, docString };
    }

    protected createStep(keyword: StepKeyword, text: string, docString?: string): Step {
        return { keyword, text, docString };
    }

    protected formatEndpoint(analysis: EndpointAnalysis): string {
        return `${analysis.method.toUpperCase()} ${analysis.path}`;
    }
}
