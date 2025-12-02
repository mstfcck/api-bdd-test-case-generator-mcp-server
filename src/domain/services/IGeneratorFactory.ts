import { IScenarioGenerator } from './IScenarioGenerator.js';
import { ScenarioType } from '../value-objects/index.js';

export interface IGeneratorFactory {
    create(type: ScenarioType): IScenarioGenerator;
    register(generator: IScenarioGenerator): void;
}
