import { injectable, inject } from 'inversify';
import { IStateRepository, IFileSystem, ISpecificationRepository } from '../ports/index.js';
import { IFeatureAssembler, IFeatureSerializer } from '../../domain/services/index.js';
import { StateError } from '../../domain/errors/index.js';
import { ExportFeatureRequest, ExportFeatureResponse } from '../dtos/index.js';
import { type ILogger } from '../../shared/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class ExportFeatureUseCase {
    constructor(
        @inject(TYPES.IStateRepository) private readonly stateRepository: IStateRepository,
        @inject(TYPES.ISpecificationRepository) private readonly specRepository: ISpecificationRepository,
        @inject(TYPES.IFeatureAssembler) private readonly featureAssembler: IFeatureAssembler,
        @inject(TYPES.IFeatureSerializer) private readonly featureSerializer: IFeatureSerializer,
        @inject(TYPES.IFileSystem) private readonly fileSystem: IFileSystem,
        @inject(TYPES.ILogger) private readonly logger: ILogger
    ) { }

    async execute(request: ExportFeatureRequest): Promise<ExportFeatureResponse> {
        this.logger.info('Exporting feature file', { request });

        // Get scenarios from state
        const scenarios = await this.stateRepository.getScenarios();
        if (scenarios.length === 0) {
            throw new StateError('No scenarios found. Please generate scenarios first.');
        }

        // Get endpoint context for metadata
        const analysis = await this.stateRepository.getEndpointContext();
        if (!analysis) {
            throw new StateError('No endpoint context found.');
        }

        // Get actual spec metadata instead of hardcoded values
        const spec = await this.specRepository.get();
        const specSource = spec?.getSource() ?? 'unknown';
        const specVersion = spec?.getOpenApiVersion() ?? 'unknown';

        // Create feature file
        const featureFile = this.featureAssembler.assemble(
            scenarios,
            analysis.path,
            analysis.method,
            {
                openApiSpec: specSource,
                openApiVersion: specVersion,
                operationId: analysis.operationId
            }
        );

        // Serialize to desired format
        const content = this.featureSerializer.serialize(featureFile, request.format);

        // Write to file if path provided
        if (request.outputPath) {
            await this.fileSystem.writeFile(request.outputPath, content);
        }

        const stats = {
            featureName: featureFile.getFeature().name,
            scenarioCount: featureFile.getScenarioCount(),
            totalSteps: featureFile.getTotalStepCount(),
            size: content.length
        };

        const response: ExportFeatureResponse = {
            success: true,
            format: request.format,
            content,
            filePath: request.outputPath,
            stats
        };

        this.logger.info('Feature file exported successfully', { stats });

        return response;
    }
}
