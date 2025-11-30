import 'reflect-metadata';
import { GeneratorFactory } from '../../../src/infrastructure/generators/GeneratorFactory';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';

describe('GeneratorFactory', () => {
    let factory: GeneratorFactory;

    beforeEach(() => {
        factory = new GeneratorFactory();
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
