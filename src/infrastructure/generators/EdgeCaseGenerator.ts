import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

export class EdgeCaseGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.EDGE_CASE;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.given('the API is available'),
            this.when(`I send a ${analysis.method} request to ${analysis.path} with edge case data`),
            this.then('the response should handle the edge case appropriately')
        ];

        return [
            this.createScenario(
                `${this.formatEndpoint(analysis)} - Edge cases`,
                ScenarioType.EDGE_CASE,
                steps,
                ['@edge-case']
            )
        ];
    }
}
