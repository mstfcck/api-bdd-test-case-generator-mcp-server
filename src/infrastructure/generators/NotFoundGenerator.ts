import { injectable, inject } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis, IDataGenerator } from '../../domain/services/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class NotFoundGenerator extends BaseScenarioGenerator {
    constructor(
        @inject(TYPES.IDataGenerator) private dataGenerator: IDataGenerator
    ) {
        super();
    }

    getType(): ScenarioType {
        return ScenarioType.NOT_FOUND;
    }

    canGenerate(analysis: EndpointAnalysis): boolean {
        return ['GET', 'DELETE', 'PUT', 'PATCH'].includes(analysis.method.toUpperCase()) &&
            analysis.parameters.some(p => p.in === 'path');
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        let pathWithInvalidId = analysis.path;

        // Find path parameters and replace them with non-existent IDs
        const pathParams = analysis.parameters.filter(p => p.in === 'path');
        for (const param of pathParams) {
            const invalidId = this.dataGenerator.generateIdentifier(param.schema);
            pathWithInvalidId = pathWithInvalidId.replace(`{${param.name}}`, String(invalidId));
        }

        const steps = [
            this.createGiven('the API is available'),
            this.createWhen(`I send a ${analysis.method} request to ${pathWithInvalidId} with a non-existent resource ID`),
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
