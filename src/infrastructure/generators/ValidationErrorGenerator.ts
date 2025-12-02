import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

export class ValidationErrorGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.VALIDATION_ERROR;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.given('the API is available'),
            this.when(`I send a ${analysis.method} request to ${analysis.path} with invalid data`),
            this.then('the response status should be 400'),
            this.and('the response should contain validation errors')
        ];

        return [
            this.createScenario(
                `${this.formatEndpoint(analysis)} - Validation error`,
                ScenarioType.VALIDATION_ERROR,
                steps,
                ['@negative', '@validation']
            )
        ];
    }
}
