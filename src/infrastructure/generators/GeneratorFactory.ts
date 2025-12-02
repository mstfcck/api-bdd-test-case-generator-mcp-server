import { injectable } from 'inversify';
import { IScenarioGenerator } from '../../domain/services/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { RequiredFieldsGenerator } from './RequiredFieldsGenerator.js';
import { AllFieldsGenerator } from './AllFieldsGenerator.js';
import { ValidationErrorGenerator } from './ValidationErrorGenerator.js';
import { AuthErrorGenerator } from './AuthErrorGenerator.js';
import { NotFoundGenerator } from './NotFoundGenerator.js';
import { EdgeCaseGenerator } from './EdgeCaseGenerator.js';

@injectable()
export class GeneratorFactory {
    private generators: Map<ScenarioType, IScenarioGenerator>;

    constructor() {
        this.generators = new Map();
        this.registerDefaultGenerators();
    }

    create(type: ScenarioType): IScenarioGenerator {
        const generator = this.generators.get(type);
        if (!generator) {
            throw new Error(`No generator registered for type: ${type}`);
        }
        return generator;
    }

    register(generator: IScenarioGenerator): void {
        this.generators.set(generator.getType(), generator);
    }

    private registerDefaultGenerators(): void {
        this.register(new RequiredFieldsGenerator());
        this.register(new AllFieldsGenerator());
        this.register(new ValidationErrorGenerator());
        this.register(new AuthErrorGenerator());
        this.register(new NotFoundGenerator());
        this.register(new EdgeCaseGenerator());
    }
}
