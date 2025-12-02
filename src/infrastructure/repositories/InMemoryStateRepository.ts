import { injectable } from 'inversify';
import { IStateRepository } from '../../application/ports/index.js';
import { TestScenario } from '../../domain/entities/index.js';
import { EndpointAnalysis } from '../../domain/services/index.js';

@injectable()
export class InMemoryStateRepository implements IStateRepository {
    private endpointContext: EndpointAnalysis | null = null;
    private scenarios: TestScenario[] = [];

    async saveEndpointContext(analysis: EndpointAnalysis): Promise<void> {
        this.endpointContext = analysis;
    }

    async getEndpointContext(): Promise<EndpointAnalysis | null> {
        return this.endpointContext;
    }

    async saveScenarios(scenarios: TestScenario[]): Promise<void> {
        this.scenarios = scenarios;
    }

    async getScenarios(): Promise<TestScenario[]> {
        return this.scenarios;
    }

    async clear(): Promise<void> {
        this.endpointContext = null;
        this.scenarios = [];
    }
}

