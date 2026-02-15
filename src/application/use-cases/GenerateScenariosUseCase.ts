import { injectable, inject } from 'inversify';
import { IStateRepository } from '../ports/index.js';
import { IScenarioGeneratorRegistry } from '../../domain/services/index.js';
import { StateError } from '../../domain/errors/index.js';
import { GenerateScenariosRequest, GenerateScenariosResponse, ScenarioSummary } from '../dtos/index.js';
import { type ILogger } from '../../shared/index.js';
import { ScenarioType } from '../../domain/value-objects/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class GenerateScenariosUseCase {
    constructor(
        @inject(TYPES.IStateRepository) private readonly stateRepository: IStateRepository,
        @inject(TYPES.IScenarioGeneratorRegistry) private readonly generatorRegistry: IScenarioGeneratorRegistry,
        @inject(TYPES.ILogger) private readonly logger: ILogger
    ) { }

    async execute(request: GenerateScenariosRequest): Promise<GenerateScenariosResponse> {
        this.logger.info('Generating scenarios', { request });

        // Get endpoint context
        const analysis = await this.stateRepository.getEndpointContext();
        if (!analysis) {
            throw new StateError('No endpoint context found. Please analyze an endpoint first.');
        }

        // Determine which scenario types to generate
        const typesToGenerate = request.scenarioTypes || Object.values(ScenarioType);

        // Generate scenarios for each type
        const allScenarios = [];
        const groupedByType: Record<ScenarioType, number> = {} as Record<ScenarioType, number>;

        for (const type of typesToGenerate) {
            const generator = this.generatorRegistry.get(type);

            if (!generator.canGenerate(analysis)) {
                this.logger.debug(`Skipping ${type} - generator cannot generate for this endpoint`);
                continue;
            }

            const scenarios = generator.generate(analysis);
            allScenarios.push(...scenarios);
            groupedByType[type] = scenarios.length;
        }

        // Save scenarios to state
        await this.stateRepository.saveScenarios(allScenarios);

        // Create summaries
        const scenarioSummaries: ScenarioSummary[] = allScenarios.map(scenario => ({
            name: scenario.getName(),
            type: scenario.getType(),
            scenarioType: scenario.getScenarioType(),
            stepCount: scenario.getStepCount(),
            exampleCount: scenario.getExampleCount() || undefined,
            tags: scenario.getTags()
        }));

        const response: GenerateScenariosResponse = {
            success: true,
            scenarios: scenarioSummaries,
            totalCount: allScenarios.length,
            groupedByType
        };

        this.logger.info('Scenarios generated successfully', {
            totalCount: allScenarios.length,
            groupedByType
        });

        return response;
    }
}
