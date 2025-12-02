import 'reflect-metadata';
import { GeneratorFactory } from '../../../src/infrastructure/generators/GeneratorFactory';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';
import { RequiredFieldsGenerator } from '../../../src/infrastructure/generators/RequiredFieldsGenerator';
import { AllFieldsGenerator } from '../../../src/infrastructure/generators/AllFieldsGenerator';
import { ValidationErrorGenerator } from '../../../src/infrastructure/generators/ValidationErrorGenerator';
import { AuthErrorGenerator } from '../../../src/infrastructure/generators/AuthErrorGenerator';
import { NotFoundGenerator } from '../../../src/infrastructure/generators/NotFoundGenerator';
import { EdgeCaseGenerator } from '../../../src/infrastructure/generators/EdgeCaseGenerator';

describe('GeneratorFactory', () => {
    let factory: GeneratorFactory;

    beforeEach(() => {
        const generators = [
            new RequiredFieldsGenerator(),
            new AllFieldsGenerator(),
            new ValidationErrorGenerator(),
            new AuthErrorGenerator(),
            new NotFoundGenerator(),
            new EdgeCaseGenerator()
        ];
        factory = new GeneratorFactory(generators);
    });

    describe('create', () => {
        it('should create REQUIRED_FIELDS generator', () => {
            const generator = factory.create(ScenarioType.REQUIRED_FIELDS);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.REQUIRED_FIELDS);
        });

        it('should create ALL_FIELDS generator', () => {
            const generator = factory.create(ScenarioType.ALL_FIELDS);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.ALL_FIELDS);
        });

        it('should create VALIDATION_ERROR generator', () => {
            const generator = factory.create(ScenarioType.VALIDATION_ERROR);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.VALIDATION_ERROR);
        });

        it('should create AUTH_ERROR generator', () => {
            const generator = factory.create(ScenarioType.AUTH_ERROR);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.AUTH_ERROR);
        });

        it('should create NOT_FOUND generator', () => {
            const generator = factory.create(ScenarioType.NOT_FOUND);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.NOT_FOUND);
        });

        it('should create EDGE_CASE generator', () => {
            const generator = factory.create(ScenarioType.EDGE_CASE);

            expect(generator).toBeDefined();
            expect(generator.getType()).toBe(ScenarioType.EDGE_CASE);
        });
    });
});
