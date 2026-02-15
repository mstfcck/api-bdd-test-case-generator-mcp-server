export const TYPES = {
    // Domain Services
    ISpecificationParser: Symbol.for('ISpecificationParser'),
    IRefResolver: Symbol.for('IRefResolver'),
    IEndpointAnalyzer: Symbol.for('IEndpointAnalyzer'),
    IScenarioGenerator: Symbol.for('IScenarioGenerator'),
    IDataGenerator: Symbol.for('IDataGenerator'),
    IFeatureAssembler: Symbol.for('IFeatureAssembler'),
    IFeatureSerializer: Symbol.for('IFeatureSerializer'),
    IScenarioGeneratorRegistry: Symbol.for('IScenarioGeneratorRegistry'),

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

    // Shared
    ILogger: Symbol.for('ILogger')
} as const;
