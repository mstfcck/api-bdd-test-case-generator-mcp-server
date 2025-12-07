import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';

// Domain Services
import { ISpecificationAnalyzer, IRefResolver, IEndpointAnalyzer, IFeatureExporter, IScenarioGenerator, IDataGenerator } from '../domain/services/index.js';

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
import { GeneratorFactory } from '../infrastructure/generators/GeneratorFactory.js';
import { DataGenerator } from '../infrastructure/generators/DataGenerator.js';
import { RequiredFieldsGenerator } from '../infrastructure/generators/RequiredFieldsGenerator.js';
import { AllFieldsGenerator } from '../infrastructure/generators/AllFieldsGenerator.js';
import { ValidationErrorGenerator } from '../infrastructure/generators/ValidationErrorGenerator.js';
import { AuthErrorGenerator } from '../infrastructure/generators/AuthErrorGenerator.js';
import { NotFoundGenerator } from '../infrastructure/generators/NotFoundGenerator.js';
import { EdgeCaseGenerator } from '../infrastructure/generators/EdgeCaseGenerator.js';
import { GherkinExporter } from '../infrastructure/exporters/index.js';
import { RequestValidator } from '../infrastructure/mcp/RequestValidator.js';

// Shared
import { Logger } from '../shared/index.js';

export function createContainer(): Container {
    const container = new Container();

    // Bind Logger
    container.bind<Logger>(TYPES.Logger).toConstantValue(new Logger({ level: 'info' }));

    // Bind Domain Services
    container.bind<IRefResolver>(TYPES.IRefResolver).to(RefResolver).inSingletonScope();
    container.bind<ISpecificationAnalyzer>(TYPES.ISpecificationAnalyzer).to(SpecificationAnalyzer).inSingletonScope();
    container.bind<IEndpointAnalyzer>(TYPES.IEndpointAnalyzer).to(EndpointAnalyzer).inSingletonScope();
    container.bind<IFeatureExporter>(TYPES.IFeatureExporter).to(GherkinExporter).inSingletonScope();
    container.bind<IDataGenerator>(TYPES.IDataGenerator).to(DataGenerator).inSingletonScope();

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

    // Bind Factories
    container.bind(TYPES.GeneratorFactory).to(GeneratorFactory).inSingletonScope();
    container.bind(TYPES.RequestValidator).to(RequestValidator).inSingletonScope();

    // Bind Use Cases
    container.bind<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase).to(LoadSpecificationUseCase);
    container.bind<ListEndpointsUseCase>(TYPES.ListEndpointsUseCase).to(ListEndpointsUseCase);
    container.bind<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase).to(AnalyzeEndpointUseCase);
    container.bind<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase).to(GenerateScenariosUseCase);
    container.bind<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase).to(ExportFeatureUseCase);

    return container;
}
