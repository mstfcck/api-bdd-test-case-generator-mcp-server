import { injectable, multiInject } from 'inversify';
import { IScenarioGenerator, IGeneratorFactory } from '../../domain/services/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class GeneratorFactory implements IGeneratorFactory {
    private generators: Map<ScenarioType, IScenarioGenerator>;

    constructor(
        @multiInject(TYPES.IScenarioGenerator) generators: IScenarioGenerator[]
    ) {
        this.generators = new Map();
        generators.forEach(generator => {
            this.register(generator);
        });
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
}
