import { z, ZodSchema, ZodType } from 'zod';
import { ValidationError } from '../../domain/errors/index.js';

export interface ValidationHandler<T = unknown> {
    validate(input: T): ValidationResult<T>;
    setNext(handler: ValidationHandler<T>): ValidationHandler<T>;
}

export interface ValidationResult<T = unknown> {
    success: boolean;
    data?: T;
    errors?: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
    field: string;
    message: string;
    code: string;
}

export class ValidationPipeline<T> implements ValidationHandler<T> {
    private handlers: ValidationHandler<T>[] = [];

    add(handler: ValidationHandler<T>): this {
        this.handlers.push(handler);
        return this;
    }

    validate(input: T): ValidationResult<T> {
        let currentData = input;
        const allErrors: ValidationErrorDetail[] = [];

        for (const handler of this.handlers) {
            const result = handler.validate(currentData);

            if (!result.success) {
                allErrors.push(...(result.errors || []));
            } else if (result.data !== undefined) {
                currentData = result.data;
            }
        }

        if (allErrors.length > 0) {
            return {
                success: false,
                errors: allErrors
            };
        }

        return {
            success: true,
            data: currentData
        };
    }

    setNext(handler: ValidationHandler<T>): ValidationHandler<T> {
        this.handlers.push(handler);
        return this;
    }
}

export class ZodValidationHandler<T> implements ValidationHandler<T> {
    constructor(private schema: ZodType<T, any, any>) { }

    validate(input: T): ValidationResult<T> {
        const result = this.schema.safeParse(input);

        if (!result.success) {
            const errors: ValidationErrorDetail[] = result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }));

            return {
                success: false,
                errors
            };
        }

        return {
            success: true,
            data: result.data
        };
    }

    setNext(handler: ValidationHandler<T>): ValidationHandler<T> {
        throw new Error('ZodValidationHandler does not support chaining. Use ValidationPipeline instead.');
    }
}

export class CustomValidationHandler<T> implements ValidationHandler<T> {
    constructor(
        private validateFn: (input: T) => { valid: boolean; error?: string; field?: string }
    ) { }

    validate(input: T): ValidationResult<T> {
        const result = this.validateFn(input);

        if (!result.valid) {
            return {
                success: false,
                errors: [{
                    field: result.field || 'unknown',
                    message: result.error || 'Validation failed',
                    code: 'CUSTOM_VALIDATION_ERROR'
                }]
            };
        }

        return {
            success: true,
            data: input
        };
    }

    setNext(handler: ValidationHandler<T>): ValidationHandler<T> {
        throw new Error('CustomValidationHandler does not support chaining. Use ValidationPipeline instead.');
    }
}

export function createValidationPipeline<T>(): ValidationPipeline<T> {
    return new ValidationPipeline<T>();
}

export function zodValidator<T>(schema: ZodType<T, any, any>): ZodValidationHandler<T> {
    return new ZodValidationHandler(schema);
}

export function customValidator<T>(
    validateFn: (input: T) => { valid: boolean; error?: string; field?: string }
): CustomValidationHandler<T> {
    return new CustomValidationHandler(validateFn);
}
