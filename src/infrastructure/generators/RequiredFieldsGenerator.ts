import { injectable } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

@injectable()
export class RequiredFieldsGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.REQUIRED_FIELDS;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const scenarios: TestScenario[] = [];

        const steps = [
            this.createGiven('the API is available'),
            this.createWhen(`I send a ${analysis.method} request to ${analysis.path} with required fields only`),
            this.createThen('the response status should be 200 or 201'),
            this.createAnd('the response should contain the expected data')
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
