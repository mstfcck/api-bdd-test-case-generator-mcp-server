import { IScenarioGenerator } from './IScenarioGenerator.js';
import { ScenarioType } from '../value-objects/index.js';

/**
 * Registry for scenario generators — retrieves pre-registered generator instances by type.
 * This is a Registry/Strategy-locator pattern, not a Factory (no new instances are created).
 */
export interface IScenarioGeneratorRegistry {
    get(type: ScenarioType): IScenarioGenerator;
    register(generator: IScenarioGenerator): void;
}
