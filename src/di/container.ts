import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';

// Domain Services
import {
    ISpecificationParser,
    IRefResolver,
    IEndpointAnalyzer,
    IFeatureAssembler,
    IFeatureSerializer,
    IScenarioGenerator,
    IScenarioGeneratorRegistry,
    IDataGenerator
} from '../domain/services/index.js';

// Application Ports
import { ISpecificationRepository, IStateRepository, IFileSystem } from '../application/ports/index.js';

// Use Cases
import {
    LoadSpecificationUseCase,
    ListEndpointsUseCase,
    AnalyzeEndpointUseCase,
    GenerateScenariosUseCase,
    ExportFeatureUseCase
} from '../application/use-cases/index.js';

// Infrastructure
import {
    SpecificationAnalyzer,
    RefResolver,
    EndpointAnalyzer
} from '../infrastructure/analyzers/index.js';
import {
    InMemorySpecificationRepository,
    InMemoryStateRepository
} from '../infrastructure/repositories/index.js';
import { NodeFileSystem } from '../infrastructure/filesystem/index.js';
import { ScenarioGeneratorRegistry } from '../infrastructure/generators/GeneratorFactory.js';
import { DataGenerator } from '../infrastructure/generators/DataGenerator.js';
import { RequiredFieldsGenerator } from '../infrastructure/generators/RequiredFieldsGenerator.js';
import { AllFieldsGenerator } from '../infrastructure/generators/AllFieldsGenerator.js';
import { ValidationErrorGenerator } from '../infrastructure/generators/ValidationErrorGenerator.js';
import { AuthErrorGenerator } from '../infrastructure/generators/AuthErrorGenerator.js';
import { NotFoundGenerator } from '../infrastructure/generators/NotFoundGenerator.js';
import { EdgeCaseGenerator } from '../infrastructure/generators/EdgeCaseGenerator.js';
import { GherkinExporter } from '../infrastructure/exporters/index.js';
import { McpServerAdapter } from '../infrastructure/mcp/McpServerAdapter.js';

// Shared
import { Logger, type ILogger } from '../shared/index.js';

export function createContainer(): Container {
    const container = new Container();

    // Bind Logger (ILogger interface)
    container.bind<ILogger>(TYPES.ILogger).toConstantValue(new Logger({ level: 'info' }));

    // Bind Domain Services
    container.bind<IRefResolver>(TYPES.IRefResolver).to(RefResolver).inSingletonScope();
    container.bind<ISpecificationParser>(TYPES.ISpecificationParser).to(SpecificationAnalyzer).inSingletonScope();
    container.bind<IEndpointAnalyzer>(TYPES.IEndpointAnalyzer).to(EndpointAnalyzer).inSingletonScope();
    container.bind<IDataGenerator>(TYPES.IDataGenerator).to(DataGenerator).inSingletonScope();

    // Bind Feature Assembler + Serializer (same implementation, two interfaces)
    container.bind<GherkinExporter>(GherkinExporter).toSelf().inSingletonScope();
    container.bind<IFeatureAssembler>(TYPES.IFeatureAssembler).toService(GherkinExporter);
    container.bind<IFeatureSerializer>(TYPES.IFeatureSerializer).toService(GherkinExporter);

    // Bind Repositories
    container.bind<ISpecificationRepository>(TYPES.ISpecificationRepository).to(InMemorySpecificationRepository).inSingletonScope();
    container.bind<IStateRepository>(TYPES.IStateRepository).to(InMemoryStateRepository).inSingletonScope();
    container.bind<IFileSystem>(TYPES.IFileSystem).to(NodeFileSystem).inSingletonScope();

    // Bind Generators
    container.bind(RequiredFieldsGenerator).toSelf().inSingletonScope();
    container.bind(AllFieldsGenerator).toSelf().inSingletonScope();
    container.bind(ValidationErrorGenerator).toSelf().inSingletonScope();
    container.bind(AuthErrorGenerator).toSelf().inSingletonScope();
    container.bind(NotFoundGenerator).toSelf().inSingletonScope();
    container.bind(EdgeCaseGenerator).toSelf().inSingletonScope();

    container.bind<IScenarioGenerator>(TYPES.IScenarioGenerator).toService(RequiredFieldsGenerator);
    container.bind<IScenarioGenerator>(TYPES.IScenarioGenerator).toService(AllFieldsGenerator);
    container.bind<IScenarioGenerator>(TYPES.IScenarioGenerator).toService(ValidationErrorGenerator);
    container.bind<IScenarioGenerator>(TYPES.IScenarioGenerator).toService(AuthErrorGenerator);
    container.bind<IScenarioGenerator>(TYPES.IScenarioGenerator).toService(NotFoundGenerator);
    container.bind<IScenarioGenerator>(TYPES.IScenarioGenerator).toService(EdgeCaseGenerator);

    // Bind Scenario Generator Registry
    container.bind<IScenarioGeneratorRegistry>(TYPES.IScenarioGeneratorRegistry).to(ScenarioGeneratorRegistry).inSingletonScope();

    // Bind Use Cases
    container.bind<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase).to(LoadSpecificationUseCase);
    container.bind<ListEndpointsUseCase>(TYPES.ListEndpointsUseCase).to(ListEndpointsUseCase);
    container.bind<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase).to(AnalyzeEndpointUseCase);
    container.bind<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase).to(GenerateScenariosUseCase);
    container.bind<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase).to(ExportFeatureUseCase);

    // Bind MCP Server Adapter
    container.bind(McpServerAdapter).toSelf().inSingletonScope();

    return container;
}
