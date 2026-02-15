import { injectable, multiInject } from 'inversify';
import { IScenarioGenerator, IScenarioGeneratorRegistry } from '../../domain/services/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class ScenarioGeneratorRegistry implements IScenarioGeneratorRegistry {
    private readonly generators: ReadonlyMap<ScenarioType, IScenarioGenerator>;

    constructor(
        @multiInject(TYPES.IScenarioGenerator) generators: IScenarioGenerator[]
    ) {
        const map = new Map<ScenarioType, IScenarioGenerator>();
        for (const generator of generators) {
            map.set(generator.getType(), generator);
        }
        this.generators = map;
    }

    get(type: ScenarioType): IScenarioGenerator {
        const generator = this.generators.get(type);
        if (!generator) {
            throw new Error(`No generator registered for type: ${type}`);
        }
        return generator;
    }

    register(generator: IScenarioGenerator): void {
        (this.generators as Map<ScenarioType, IScenarioGenerator>).set(generator.getType(), generator);
    }
}
