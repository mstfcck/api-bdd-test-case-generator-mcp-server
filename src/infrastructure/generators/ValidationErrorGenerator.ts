import { injectable, inject } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis, type GeneratedValue, IDataGenerator } from '../../domain/services/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class ValidationErrorGenerator extends BaseScenarioGenerator {
    constructor(
        @inject(TYPES.IDataGenerator) private readonly dataGenerator: IDataGenerator
    ) {
        super();
    }

    getType(): ScenarioType {
        return ScenarioType.VALIDATION_ERROR;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        let payload: GeneratedValue | undefined = undefined;

        if (analysis.requestBody && analysis.requestBody.schema) {
            payload = this.dataGenerator.generateInvalid(analysis.requestBody.schema);
        }

        const steps = [
            this.createGiven('the API is available'),
            this.createWhen(`I send a ${analysis.method} request to ${analysis.path} with invalid data`, payload ? JSON.stringify(payload, null, 2) : undefined),
            this.createThen('the response status should be 400'),
            this.createAnd('the response should contain validation errors')
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
