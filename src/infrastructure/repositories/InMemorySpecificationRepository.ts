import { injectable } from 'inversify';
import { ISpecificationRepository } from '../../application/ports/index.js';
import { OpenAPISpecification } from '../../domain/entities/index.js';

@injectable()
export class InMemorySpecificationRepository implements ISpecificationRepository {
    private specification: OpenAPISpecification | null = null;

    async save(spec: OpenAPISpecification): Promise<void> {
        this.specification = spec;
    }

    async get(): Promise<OpenAPISpecification | null> {
        return this.specification;
    }

    async exists(): Promise<boolean> {
        return this.specification !== null;
    }

    async clear(): Promise<void> {
        this.specification = null;
    }
}
