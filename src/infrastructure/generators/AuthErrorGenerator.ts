import { injectable } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

@injectable()
export class AuthErrorGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.AUTH_ERROR;
    }

    canGenerate(analysis: EndpointAnalysis): boolean {
        return analysis.security.length > 0;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.createGiven('I am not authenticated'),
            this.createWhen(`I send a ${analysis.method} request to ${analysis.path}`),
            this.createThen('the response status should be 401'),
            this.createAnd('the response should contain an authentication error')
        ];

        return [
            this.createScenario(
                `${this.formatEndpoint(analysis)} - Authentication required`,
                ScenarioType.AUTH_ERROR,
                steps,
                ['@negative', '@auth']
            )
        ];
    }
}
