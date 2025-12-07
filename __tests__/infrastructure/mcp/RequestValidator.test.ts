import 'reflect-metadata';
import { RequestValidator } from '../../../src/infrastructure/mcp/RequestValidator';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';

describe('RequestValidator', () => {
    let validator: RequestValidator;

    beforeEach(() => {
        validator = new RequestValidator();
    });

    describe('validateLoadSpec', () => {
        it('should validate valid file path request', () => {
            const input = { filePath: '/path/to/spec.yaml' };
            const result = validator.validateLoadSpec(input);
            expect(result).toEqual(input);
        });

        it('should validate valid content request', () => {
            const input = { content: 'openapi: 3.0.0', format: 'yaml' };
            const result = validator.validateLoadSpec(input);
            expect(result).toEqual(input);
        });

        it('should throw error when neither filePath nor content is provided', () => {
            const input = {};
            expect(() => validator.validateLoadSpec(input)).toThrow('Validation failed');
        });
    });

    describe('validateListEndpoints', () => {
        it('should validate valid request with filter', () => {
            const input = { filter: { method: 'GET' } };
            const result = validator.validateListEndpoints(input);
            expect(result).toEqual(input);
        });

        it('should validate empty request', () => {
            const input = {};
            const result = validator.validateListEndpoints(input);
            expect(result).toEqual(input);
        });
    });

    describe('validateAnalyzeEndpoint', () => {
        it('should validate valid request', () => {
            const input = { path: '/users', method: 'GET' };
            const result = validator.validateAnalyzeEndpoint(input);
            expect(result).toEqual(input);
        });

        it('should throw error when path is missing', () => {
            const input = { method: 'GET' };
            expect(() => validator.validateAnalyzeEndpoint(input)).toThrow('Validation failed');
        });

        it('should throw error when method is invalid', () => {
            const input = { path: '/users', method: 'INVALID' };
            expect(() => validator.validateAnalyzeEndpoint(input)).toThrow('Validation failed');
        });
    });

    describe('validateGenerateScenarios', () => {
        it('should validate valid request with scenario types', () => {
            const input = { scenarioTypes: [ScenarioType.REQUIRED_FIELDS] };
            const result = validator.validateGenerateScenarios(input);
            expect(result).toEqual(input);
        });

        it('should validate empty request', () => {
            const input = {};
            const result = validator.validateGenerateScenarios(input);
            expect(result).toEqual(input);
        });

        it('should throw error when scenario type is invalid', () => {
            const input = { scenarioTypes: ['invalid_type'] };
            expect(() => validator.validateGenerateScenarios(input)).toThrow('Validation failed');
        });
    });

    describe('validateExportFeature', () => {
        it('should validate valid request', () => {
            const input = { format: 'gherkin', includeComments: true };
            const result = validator.validateExportFeature(input);
            expect(result).toEqual(input);
        });

        it('should validate empty request', () => {
            const input = {};
            const result = validator.validateExportFeature(input);
            expect(result).toEqual({
                format: 'gherkin',
                includeComments: true
            });
        });

        it('should throw error when format is invalid', () => {
            const input = { format: 'invalid' };
            expect(() => validator.validateExportFeature(input)).toThrow('Validation failed');
        });
    });
});
