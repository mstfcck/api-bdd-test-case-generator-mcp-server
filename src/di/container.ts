import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';

// Domain Services
import { ISpecificationAnalyzer, IRefResolver, IEndpointAnalyzer, IScenarioGenerator, IFeatureExporter } from '../domain/services/index.js';

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
import { GeneratorFactory } from '../infrastructure/generators/index.js';
import { GherkinExporter } from '../infrastructure/exporters/index.js';

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

    // Bind Repositories
    container.bind<ISpecificationRepository>(TYPES.ISpecificationRepository).to(InMemorySpecificationRepository).inSingletonScope();
    container.bind<IStateRepository>(TYPES.IStateRepository).to(InMemoryStateRepository).inSingletonScope();
    container.bind<IFileSystem>(TYPES.IFileSystem).to(NodeFileSystem).inSingletonScope();

    // Bind Factories
    container.bind(TYPES.GeneratorFactory).to(GeneratorFactory).inSingletonScope();

    // Bind Use Cases
    container.bind<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase).to(LoadSpecificationUseCase);
    container.bind<ListEndpointsUseCase>(TYPES.ListEndpointsUseCase).to(ListEndpointsUseCase);
    container.bind<AnalyzeEndpointUseCase>(TYPES.AnalyzeEndpointUseCase).to(AnalyzeEndpointUseCase);
    container.bind<GenerateScenariosUseCase>(TYPES.GenerateScenariosUseCase).to(GenerateScenariosUseCase);
    container.bind<ExportFeatureUseCase>(TYPES.ExportFeatureUseCase).to(ExportFeatureUseCase);

    return container;
}
