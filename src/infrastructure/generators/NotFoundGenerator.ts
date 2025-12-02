import { injectable } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

@injectable()
export class NotFoundGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.NOT_FOUND;
    }

    canGenerate(analysis: EndpointAnalysis): boolean {
        return ['GET', 'DELETE', 'PUT', 'PATCH'].includes(analysis.method.toUpperCase());
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.createGiven('the API is available'),
            this.createWhen(`I send a ${analysis.method} request to ${analysis.path} with a non-existent resource ID`),
            this.createThen('the response status should be 404'),
            this.createAnd('the response should contain a not found error')
        ];

        return [
            this.createScenario(
                `${this.formatEndpoint(analysis)} - Resource not found`,
                ScenarioType.NOT_FOUND,
                steps,
                ['@negative', '@not-found']
            )
        ];
    }
}
