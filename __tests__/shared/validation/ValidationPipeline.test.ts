import { z } from 'zod';
import {
    ValidationPipeline,
    zodValidator,
    customValidator,
    createValidationPipeline,
    ZodValidationHandler,
    CustomValidationHandler
} from '../../../src/shared/validation/ValidationPipeline';

describe('ValidationPipeline', () => {
    describe('ValidationPipeline Class', () => {
        it('should execute validators in order', () => {
            const pipeline = new ValidationPipeline<string>();
            const validator1 = {
                validate: jest.fn().mockReturnValue({ success: true, data: 'step1' }),
                setNext: jest.fn()
            };
            const validator2 = {
                validate: jest.fn().mockReturnValue({ success: true, data: 'step2' }),
                setNext: jest.fn()
            };

            pipeline.add(validator1).add(validator2);
            const result = pipeline.validate('input');

            expect(validator1.validate).toHaveBeenCalledWith('input');
            expect(validator2.validate).toHaveBeenCalledWith('step1');
            expect(result).toEqual({ success: true, data: 'step2' });
        });

        it('should collect errors from all validators', () => {
            const pipeline = new ValidationPipeline<string>();
            const validator1 = {
                validate: jest.fn().mockReturnValue({
                    success: false,
                    errors: [{ field: 'f1', message: 'e1', code: 'c1' }]
                }),
                setNext: jest.fn()
            };
            const validator2 = {
                validate: jest.fn().mockReturnValue({
                    success: false,
                    errors: [{ field: 'f2', message: 'e2', code: 'c2' }]
                }),
                setNext: jest.fn()
            };

            pipeline.add(validator1).add(validator2);
            const result = pipeline.validate('input');

            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors).toEqual([
                { field: 'f1', message: 'e1', code: 'c1' },
                { field: 'f2', message: 'e2', code: 'c2' }
            ]);
        });

        it('should support setNext chaining', () => {
            const pipeline = new ValidationPipeline<string>();
            const validator = {
                validate: jest.fn(),
                setNext: jest.fn()
            };

            pipeline.setNext(validator);
            // Access private handlers to verify
            expect((pipeline as any).handlers).toContain(validator);
        });
    });

    describe('ZodValidationHandler', () => {
        const schema = z.object({
            name: z.string(),
            age: z.number().min(18)
        });

        it('should validate valid input', () => {
            const handler = zodValidator(schema);
            const input = { name: 'John', age: 25 };
            const result = handler.validate(input);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
        });

        it('should return errors for invalid input', () => {
            const handler = zodValidator(schema);
            const input = { name: 'John', age: 15 };
            const result = handler.validate(input);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors![0].message).toContain('Number must be greater than or equal to 18');
        });

        it('should throw error when setNext is called', () => {
            const handler = new ZodValidationHandler(schema);
            expect(() => handler.setNext({} as any)).toThrow('does not support chaining');
        });
    });

    describe('CustomValidationHandler', () => {
        it('should validate valid input', () => {
            const handler = customValidator((input: string) => ({ valid: input.length > 3 }));
            const result = handler.validate('long enough');

            expect(result.success).toBe(true);
            expect(result.data).toBe('long enough');
        });

        it('should return errors for invalid input', () => {
            const handler = customValidator((input: string) => ({
                valid: false,
                error: 'Too short',
                field: 'length'
            }));
            const result = handler.validate('hi');

            expect(result.success).toBe(false);
            expect(result.errors).toEqual([{
                field: 'length',
                message: 'Too short',
                code: 'CUSTOM_VALIDATION_ERROR'
            }]);
        });

        it('should throw error when setNext is called', () => {
            const handler = new CustomValidationHandler(() => ({ valid: true }));
            expect(() => handler.setNext({} as any)).toThrow('does not support chaining');
        });
    });

    describe('Helper Functions', () => {
        it('createValidationPipeline should return new pipeline', () => {
            const pipeline = createValidationPipeline();
            expect(pipeline).toBeInstanceOf(ValidationPipeline);
        });
    });
});
