import { TestScenario } from '../../domain/entities/index.js';
import { EndpointAnalysis } from '../../domain/services/index.js';

export interface IStateRepository {
    /**
     * Save endpoint analysis context
     */
    saveEndpointContext(analysis: EndpointAnalysis): Promise<void>;

    /**
     * Retrieve endpoint analysis context
     */
    getEndpointContext(): Promise<EndpointAnalysis | null>;

    /**
     * Save generated scenarios
     */
    saveScenarios(scenarios: TestScenario[]): Promise<void>;

    /**
     * Retrieve generated scenarios
     */
    getScenarios(): Promise<TestScenario[]>;

    /**
     * Clear all state
     */
    clear(): Promise<void>;
}

