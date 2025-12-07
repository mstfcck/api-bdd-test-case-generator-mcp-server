import { AuthErrorGenerator } from '../../../src/infrastructure/generators/AuthErrorGenerator';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';
import { EndpointAnalysis } from '../../../src/domain/services/EndpointAnalyzer';

describe('AuthErrorGenerator', () => {
    let generator: AuthErrorGenerator;

    beforeEach(() => {
        generator = new AuthErrorGenerator();
    });

    describe('getType', () => {
        it('should return AUTH_ERROR', () => {
            expect(generator.getType()).toBe(ScenarioType.AUTH_ERROR);
        });
    });

    describe('canGenerate', () => {
        it('should return true when endpoint has security requirements', () => {
            const analysis = {
                security: [{ basicAuth: [] }]
            } as unknown as EndpointAnalysis;
            expect(generator.canGenerate(analysis)).toBe(true);
        });

        it('should return false when endpoint has no security requirements', () => {
            const analysis = {
                security: []
            } as unknown as EndpointAnalysis;
            expect(generator.canGenerate(analysis)).toBe(false);
        });
    });

    describe('generate', () => {
        it('should generate authentication error scenario', () => {
            const analysis = {
                path: '/protected',
                method: 'GET',
                security: [{ basicAuth: [] }]
            } as unknown as EndpointAnalysis;

            const scenarios = generator.generate(analysis);

            expect(scenarios).toHaveLength(1);
            const scenario = scenarios[0];

            expect(scenario.getType()).toBe(ScenarioType.AUTH_ERROR);
            expect(scenario.getName()).toContain('GET /protected');
            expect(scenario.getTags()).toContain('@negative');
            expect(scenario.getTags()).toContain('@auth');

            const steps = scenario.getSteps();
            expect(steps).toHaveLength(4);
            expect(steps[0].text).toBe('I am not authenticated');
            expect(steps[1].text).toBe('I send a GET request to /protected');
            expect(steps[2].text).toBe('the response status should be 401');
            expect(steps[3].text).toBe('the response should contain an authentication error');
        });
    });
});
