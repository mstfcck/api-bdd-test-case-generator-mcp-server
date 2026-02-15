import 'reflect-metadata';
import { ScenarioGeneratorRegistry } from '../../../src/infrastructure/generators/GeneratorFactory';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';
import { RequiredFieldsGenerator } from '../../../src/infrastructure/generators/RequiredFieldsGenerator';
import { AllFieldsGenerator } from '../../../src/infrastructure/generators/AllFieldsGenerator';
import { ValidationErrorGenerator } from '../../../src/infrastructure/generators/ValidationErrorGenerator';
import { AuthErrorGenerator } from '../../../src/infrastructure/generators/AuthErrorGenerator';
import { NotFoundGenerator } from '../../../src/infrastructure/generators/NotFoundGenerator';
import { EdgeCaseGenerator } from '../../../src/infrastructure/generators/EdgeCaseGenerator';
import { IDataGenerator } from '../../../src/domain/services/IDataGenerator';

describe('ScenarioGeneratorRegistry', () => {
    let registry: ScenarioGeneratorRegistry;
    let mockDataGenerator: IDataGenerator;

    beforeEach(() => {
        mockDataGenerator = {
            generateValid: jest.fn(),
            generateInvalid: jest.fn(),
            generateIdentifier: jest.fn()
        };

        const generators = [
            new RequiredFieldsGenerator(mockDataGenerator),
            new AllFieldsGenerator(mockDataGenerator),
            new ValidationErrorGenerator(mockDataGenerator),
            new AuthErrorGenerator(),
            new NotFoundGenerator(mockDataGenerator),
            new EdgeCaseGenerator()
        ];
        registry = new ScenarioGeneratorRegistry(generators);
    });

    describe('get', () => {
        it('should get REQUIRED_FIELDS generator', () => {
            const generator = registry.get(ScenarioType.REQUIRED_FIELDS);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.REQUIRED_FIELDS);
        });

        it('should get ALL_FIELDS generator', () => {
            const generator = registry.get(ScenarioType.ALL_FIELDS);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.ALL_FIELDS);
        });

        it('should get VALIDATION_ERROR generator', () => {
            const generator = registry.get(ScenarioType.VALIDATION_ERROR);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.VALIDATION_ERROR);
        });

        it('should get AUTH_ERROR generator', () => {
            const generator = registry.get(ScenarioType.AUTH_ERROR);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.AUTH_ERROR);
        });

        it('should get NOT_FOUND generator', () => {
            const generator = registry.get(ScenarioType.NOT_FOUND);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.NOT_FOUND);
        });

        it('should get EDGE_CASE generator', () => {
            const generator = registry.get(ScenarioType.EDGE_CASE);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.EDGE_CASE);
        });

        it('should throw error for unknown generator type', () => {
            expect(() => registry.get('UNKNOWN_TYPE' as ScenarioType)).toThrow('No generator registered for type: UNKNOWN_TYPE');
        });
    });
});
