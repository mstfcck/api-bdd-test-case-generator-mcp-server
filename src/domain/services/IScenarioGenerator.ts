import { TestScenario } from '../entities/index.js';
import { ScenarioType } from '../value-objects/index.js';
import { EndpointAnalysis } from './IEndpointAnalyzer.js';

export interface IScenarioGenerator {
    /**
     * Get the type of scenarios this generator produces
     */
    getType(): ScenarioType;

    /**
     * Check if this generator can generate scenarios for the given endpoint
     */
    canGenerate(analysis: EndpointAnalysis): boolean;

    /**
     * Generate test scenarios based on endpoint analysis
     */
    generate(analysis: EndpointAnalysis): TestScenario[];
}
