import 'reflect-metadata';
import { BaseScenarioGenerator } from '../../../src/infrastructure/generators/BaseScenarioGenerator';
import { EndpointAnalysis } from '../../../src/domain/services/IEndpointAnalyzer';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';
import { TestScenario } from '../../../src/domain/entities/TestScenario';

class TestGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.REQUIRED_FIELDS;
    }
    generate(analysis: EndpointAnalysis): TestScenario[] {
        return [];
    }

    // Expose protected methods for testing
    public testCreateScenario(name: string, type: ScenarioType, steps: any[], tags?: string[]) {
        return this.createScenario(name, type, steps, tags);
    }
    public testCreateGiven(text: string, docString?: string) {
        return this.createGiven(text, docString);
    }
    public testCreateWhen(text: string, docString?: string) {
        return this.createWhen(text, docString);
    }
    public testCreateThen(text: string, docString?: string) {
        return this.createThen(text, docString);
    }
    public testCreateAnd(text: string, docString?: string) {
        return this.createAnd(text, docString);
    }
    public testCreateBut(text: string, docString?: string) {
        return this.createBut(text, docString);
    }
    public testCreateStep(keyword: any, text: string, docString?: string) {
        return this.createStep(keyword, text, docString);
    }
    public testFormatEndpoint(analysis: EndpointAnalysis) {
        return this.formatEndpoint(analysis);
    }
}

describe('BaseScenarioGenerator Coverage', () => {
    let generator: TestGenerator;

    beforeEach(() => {
        generator = new TestGenerator();
    });

    it('should return true for canGenerate by default', () => {
        expect(generator.canGenerate({} as any)).toBe(true);
    });

    it('should create scenario', () => {
        const scenario = generator.testCreateScenario('test', ScenarioType.REQUIRED_FIELDS, [], ['tag']);
        expect(scenario).toBeInstanceOf(TestScenario);
        expect(scenario.name).toBe('test');
        expect(scenario.type).toBe(ScenarioType.REQUIRED_FIELDS);
        expect(scenario.tags).toContain('tag');
    });

    it('should create Given step', () => {
        const step = generator.testCreateGiven('context', 'doc');
        expect(step).toEqual({ keyword: 'Given', text: 'context', docString: 'doc' });
    });

    it('should create When step', () => {
        const step = generator.testCreateWhen('action', 'doc');
        expect(step).toEqual({ keyword: 'When', text: 'action', docString: 'doc' });
    });

    it('should create Then step', () => {
        const step = generator.testCreateThen('outcome', 'doc');
        expect(step).toEqual({ keyword: 'Then', text: 'outcome', docString: 'doc' });
    });

    it('should create And step', () => {
        const step = generator.testCreateAnd('addition', 'doc');
        expect(step).toEqual({ keyword: 'And', text: 'addition', docString: 'doc' });
    });

    it('should create But step', () => {
        const step = generator.testCreateBut('exception', 'doc');
        expect(step).toEqual({ keyword: 'But', text: 'exception', docString: 'doc' });
    });

    it('should create generic step', () => {
        const step = generator.testCreateStep('Given', 'text', 'doc');
        expect(step).toEqual({ keyword: 'Given', text: 'text', docString: 'doc' });
    });

    it('should format endpoint', () => {
        const analysis: EndpointAnalysis = {
            method: 'get',
            path: '/test',
            parameters: [],
            responses: [],
            requestBody: undefined,
            security: []
        };
        expect(generator.testFormatEndpoint(analysis)).toBe('GET /test');
    });
});
