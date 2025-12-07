import 'reflect-metadata';
import { DataGenerator } from '../../../src/infrastructure/generators/DataGenerator';
import { ResolvedSchema } from '../../../src/domain/services/IEndpointAnalyzer';

describe('DataGenerator Coverage', () => {
    let generator: DataGenerator;

    beforeEach(() => {
        generator = new DataGenerator();
    });

    describe('generateInvalid', () => {
        it('should generate invalid string', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'string' }
            };
            expect(generator.generateInvalid(schema)).toBe(123);
        });

        it('should generate invalid number', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'number' }
            };
            expect(generator.generateInvalid(schema)).toBe('invalid_number');
        });

        it('should generate invalid integer', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'integer' }
            };
            expect(generator.generateInvalid(schema)).toBe('invalid_number');
        });

        it('should generate invalid boolean', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'boolean' }
            };
            expect(generator.generateInvalid(schema)).toBe('not_a_boolean');
        });

        it('should generate invalid array', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'array' }
            };
            expect(generator.generateInvalid(schema)).toEqual({ not: 'an array' });
        });

        it('should generate invalid object', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'object' }
            };
            expect(generator.generateInvalid(schema)).toBe('not_an_object');
        });

        it('should return null for unknown type', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'unknown' }
            };
            expect(generator.generateInvalid(schema)).toBeNull();
        });
    });

    describe('generateIdentifier', () => {
        it('should generate identifier for integer', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'integer' }
            };
            expect(generator.generateIdentifier(schema)).toBe(999999);
        });

        it('should generate identifier for number', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'number' }
            };
            expect(generator.generateIdentifier(schema)).toBe(999999);
        });

        it('should generate identifier for uuid string', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'string', format: 'uuid' }
            };
            expect(generator.generateIdentifier(schema)).toBe('00000000-0000-0000-0000-000000000000');
        });

        it('should generate identifier for other string', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'string' }
            };
            expect(generator.generateIdentifier(schema)).toBe('non_existent_id');
        });

        it('should generate identifier for unknown type', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'unknown' }
            };
            expect(generator.generateIdentifier(schema)).toBe('unknown_id');
        });
    });

    describe('generateValid', () => {
        it('should use enum value if present', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'string', enum: ['A', 'B'] }
            };
            expect(generator.generateValid(schema)).toBe('A');
        });

        it('should generate boolean', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'boolean' }
            };
            expect(generator.generateValid(schema)).toBe(true);
        });

        it('should generate default value for unknown type', () => {
            const schema: ResolvedSchema = {
                schema: {} as any,
                examples: [],
                constraints: { type: 'unknown' }
            };
            expect(generator.generateValid(schema)).toBe('sample_value');
        });

        describe('String Formats', () => {
            it('should generate date', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'string', format: 'date' }
                };
                expect(generator.generateValid(schema)).toBe('2023-01-01');
            });

            it('should generate date-time', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'string', format: 'date-time' }
                };
                expect(generator.generateValid(schema)).toBe('2023-01-01T00:00:00Z');
            });

            it('should generate email', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'string', format: 'email' }
                };
                expect(generator.generateValid(schema)).toBe('test@example.com');
            });

            it('should generate uuid', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'string', format: 'uuid' }
                };
                expect(generator.generateValid(schema)).toBe('123e4567-e89b-12d3-a456-426614174000');
            });

            it('should generate uri', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'string', format: 'uri' }
                };
                expect(generator.generateValid(schema)).toBe('https://example.com');
            });
        });

        describe('Number Constraints', () => {
            it('should respect minimum', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'integer', minimum: 10 }
                };
                expect(generator.generateValid(schema)).toBe(10);
            });

            it('should respect maximum', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'integer', maximum: 5 }
                };
                expect(generator.generateValid(schema)).toBe(5);
            });

            it('should default to 1', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'integer' }
                };
                expect(generator.generateValid(schema)).toBe(1);
            });
        });

        describe('Array Constraints', () => {
            it('should return empty array if no items constraint', () => {
                const schema: ResolvedSchema = {
                    schema: {} as any,
                    examples: [],
                    constraints: { type: 'array' }
                };
                expect(generator.generateValid(schema)).toEqual([]);
            });
        });
    });
});
