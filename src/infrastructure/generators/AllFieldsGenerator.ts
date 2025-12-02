import { injectable } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

@injectable()
export class AllFieldsGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.ALL_FIELDS;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.createGiven('the API is available'),
            this.createWhen(`I send a ${analysis.method} request to ${analysis.path} with all fields`),
            this.createThen('the response status should be 200 or 201'),
            this.createAnd('the response should contain all expected fields')
        ];

        return [
            this.createScenario(
                `${this.formatEndpoint(analysis)} - Success with all fields`,
                ScenarioType.ALL_FIELDS,
                steps,
                ['@positive', '@all-fields']
            )
        ];
    }
}
