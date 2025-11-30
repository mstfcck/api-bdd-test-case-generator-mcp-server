import 'reflect-metadata';
import { InMemorySpecificationRepository } from '../../../src/infrastructure/repositories/InMemorySpecificationRepository';
import { OpenAPISpecification } from '../../../src/domain/entities/OpenAPISpecification';

describe('InMemorySpecificationRepository', () => {
    let repository: InMemorySpecificationRepository;

    beforeEach(() => {
        repository = new InMemorySpecificationRepository();
    });

    describe('save and get', () => {
        it('should save and retrieve specification', async () => {
            const spec = OpenAPISpecification.create({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            }, 'test-source');

            await repository.save(spec);
            const retrieved = await repository.get();

            expect(retrieved).toBeDefined();
            expect(retrieved?.getTitle()).toBe('Test API');
            expect(retrieved?.getVersion()).toBe('1.0.0');
        });

        it('should return null when no specification is saved', async () => {
            const retrieved = await repository.get();
            expect(retrieved).toBeNull();
        });

        it('should overwrite previous specification on save', async () => {
            const spec1 = OpenAPISpecification.create({
                openapi: '3.0.0',
                info: { title: 'API v1', version: '1.0.0' },
                paths: {}
            }, 'source1');

            const spec2 = OpenAPISpecification.create({
                openapi: '3.0.0',
                info: { title: 'API v2', version: '2.0.0' },
                paths: {}
            }, 'source2');

            await repository.save(spec1);
            await repository.save(spec2);

            const retrieved = await repository.get();
            expect(retrieved?.getTitle()).toBe('API v2');
        });
    });

    describe('exists', () => {
        it('should return false when no specification exists', async () => {
            const exists = await repository.exists();
            expect(exists).toBe(false);
        });

        it('should return true when specification exists', async () => {
            const spec = OpenAPISpecification.create({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            }, 'test-source');

            await repository.save(spec);
            const exists = await repository.exists();
            expect(exists).toBe(true);
        });
    });

    describe('clear', () => {
        it('should clear the stored specification', async () => {
            const spec = OpenAPISpecification.create({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            }, 'test-source');

            await repository.save(spec);
            await repository.clear();

            const retrieved = await repository.get();
            expect(retrieved).toBeNull();

            const exists = await repository.exists();
            expect(exists).toBe(false);
        });
    });
});
