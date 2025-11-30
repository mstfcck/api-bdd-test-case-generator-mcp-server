import { injectable, inject } from 'inversify';
import { IStateRepository, IFileSystem } from '../ports/index.js';
import { IFeatureExporter } from '../../domain/services/index.js';
import { ExportFeatureRequest, ExportFeatureResponse } from '../dtos/index.js';
import { Logger } from '../../shared/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class ExportFeatureUseCase {
    constructor(
        @inject(TYPES.IStateRepository) private stateRepository: IStateRepository,
        @inject(TYPES.IFeatureExporter) private featureExporter: IFeatureExporter,
        @inject(TYPES.IFileSystem) private fileSystem: IFileSystem,
        @inject(TYPES.Logger) private logger: Logger
    ) { }

    async execute(request: ExportFeatureRequest): Promise<ExportFeatureResponse> {
        this.logger.info('Exporting feature file', { request });

        // Get scenarios from state
        const scenarios = await this.stateRepository.getScenarios();
        if (scenarios.length === 0) {
            throw new Error('No scenarios found. Please generate scenarios first.');
        }

        // Get endpoint context for metadata
        const analysis = await this.stateRepository.getEndpointContext();
        if (!analysis) {
            throw new Error('No endpoint context found.');
        }

        // Create feature file
        const featureFile = this.featureExporter.exportFeature(
            scenarios,
            analysis.path,
            analysis.method,
            {
                openApiSpec: 'loaded-spec',
                openApiVersion: '3.0.0',
                operationId: analysis.operationId
            }
        );

        // Export to desired format
        const content = this.featureExporter.export(featureFile, request.format);

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
