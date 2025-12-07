import { injectable, inject } from 'inversify';
import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis, IDataGenerator } from '../../domain/services/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class AllFieldsGenerator extends BaseScenarioGenerator {
    constructor(
        @inject(TYPES.IDataGenerator) private dataGenerator: IDataGenerator
    ) {
        super();
    }

    getType(): ScenarioType {
        return ScenarioType.ALL_FIELDS;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        let payload: any = undefined;

        if (analysis.requestBody && analysis.requestBody.schema) {
            payload = this.dataGenerator.generateValid(analysis.requestBody.schema, false);
        }

        const steps = [
            this.createGiven('the API is available'),
            this.createWhen(`I send a ${analysis.method} request to ${analysis.path} with all fields`, payload ? JSON.stringify(payload, null, 2) : undefined),
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
