import { BaseScenarioGenerator } from './BaseScenarioGenerator.js';
import { TestScenario } from '../../domain/entities/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { type EndpointAnalysis } from '../../domain/services/index.js';

export class AllFieldsGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.ALL_FIELDS;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.given('the API is available'),
            this.when(`I send a ${analysis.method} request to ${analysis.path} with all fields`),
            this.then('the response status should be 200 or 201'),
            this.and('the response should contain all expected fields')
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

export class AuthErrorGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.AUTH_ERROR;
    }

    canGenerate(analysis: EndpointAnalysis): boolean {
        return analysis.security.length > 0;
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.given('I am not authenticated'),
            this.when(`I send a ${analysis.method} request to ${analysis.path}`),
            this.then('the response status should be 401'),
            this.and('the response should contain an authentication error')
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

export class NotFoundGenerator extends BaseScenarioGenerator {
    getType(): ScenarioType {
        return ScenarioType.NOT_FOUND;
    }

    canGenerate(analysis: EndpointAnalysis): boolean {
        return ['GET', 'DELETE', 'PUT', 'PATCH'].includes(analysis.method.toUpperCase());
    }

    generate(analysis: EndpointAnalysis): TestScenario[] {
        const steps = [
            this.given('the API is available'),
            this.when(`I send a ${analysis.method} request to ${analysis.path} with a non-existent resource ID`),
            this.then('the response status should be 404'),
            this.and('the response should contain a not found error')
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
