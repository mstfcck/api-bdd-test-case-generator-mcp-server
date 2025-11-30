import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

export class RequiredFieldsGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.REQUIRED_FIELDS;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const scenarios: TestScenario[] = [];

        const steps = [
            this.given('the API is available'),
            this.when(`I send a ${analysis.method} request to ${analysis.path} with required fields only`),
            this.then('the response status should be 200 or 201'),
            this.and('the response should contain the expected data')
        ];

        const scenario = this.createScenario(
            `${this.formatEndpoint(analysis)} - Success with required fields`,
            ScenarioType.REQUIRED_FIELDS,
            steps,
            ['@positive', '@required-fields']
        );

        scenarios.push(scenario);
        return scenarios;
    }
}
