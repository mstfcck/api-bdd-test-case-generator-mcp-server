export const TYPES = {
    // Domain Services
    ISpecificationAnalyzer: Symbol.for('ISpecificationAnalyzer'),
    IRefResolver: Symbol.for('IRefResolver'),
    IEndpointAnalyzer: Symbol.for('IEndpointAnalyzer'),
    IScenarioGenerator: Symbol.for('IScenarioGenerator'),
    IFeatureExporter: Symbol.for('IFeatureExporter'),

    // Application Ports
    ISpecificationRepository: Symbol.for('ISpecificationRepository'),
    IStateRepository: Symbol.for('IStateRepository'),
    IFileSystem: Symbol.for('IFileSystem'),

    // Use Cases
    LoadSpecificationUseCase: Symbol.for('LoadSpecificationUseCase'),
    ListEndpointsUseCase: Symbol.for('ListEndpointsUseCase'),
    AnalyzeEndpointUseCase: Symbol.for('AnalyzeEndpointUseCase'),
    GenerateScenariosUseCase: Symbol.for('GenerateScenariosUseCase'),
    ExportFeatureUseCase: Symbol.for('ExportFeatureUseCase'),

    // Infrastructure
    GeneratorFactory: Symbol.for('GeneratorFactory'),
    ExporterFactory: Symbol.for('ExporterFactory'),
    RequestValidator: Symbol.for('RequestValidator'),

    // Shared
    Logger: Symbol.for('Logger')
};
