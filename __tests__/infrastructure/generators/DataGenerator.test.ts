import 'reflect-metadata';
import { DataGenerator } from '../../../src/infrastructure/generators/DataGenerator';
import { ResolvedSchema } from '../../../src/domain/services/IEndpointAnalyzer';

describe('DataGenerator', () => {
    let generator: DataGenerator;

    beforeEach(() => {
        generator = new DataGenerator();
    });

    it('should generate valid nested object data', () => {
        const schema: ResolvedSchema = {
            schema: {} as any,
            examples: [],
            constraints: {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            age: { type: 'integer' }
                        },
                        required: ['name']
                    }
                },
                required: ['user']
            }
        };

        const result = generator.generateValid(schema);
        expect(result).toEqual({
            user: {
                name: 'string_value',
                age: 1
            }
        });
    });

    it('should generate valid array data', () => {
        const schema: ResolvedSchema = {
            schema: {} as any,
            examples: [],
            constraints: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        tag: { type: 'string' }
                    }
                }
            }
        };

        const result = generator.generateValid(schema);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({
            id: 1,
            tag: 'string_value'
        });
    });

    it('should respect requiredOnly flag', () => {
        const schema: ResolvedSchema = {
            schema: {} as any,
            examples: [],
            constraints: {
                type: 'object',
                properties: {
                    requiredField: { type: 'string' },
                    optionalField: { type: 'string' }
                },
                required: ['requiredField']
            }
        };

        const result = generator.generateValid(schema, true);
        expect(result).toHaveProperty('requiredField');
        expect(result).not.toHaveProperty('optionalField');
    });
});
