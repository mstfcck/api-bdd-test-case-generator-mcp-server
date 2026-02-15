import { ZodType, type ZodTypeDef } from 'zod';

/**
 * A single-concern validator interface.
 * LSP-compliant: all implementations must fulfill the full contract.
 */
export interface Validator<T = unknown> {
    validate(input: T): ValidationResult<T>;
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

/**
 * Composite validator that runs a pipeline of validators in sequence.
 * Implements the Composite pattern — collects errors from all validators.
 */
export class ValidationPipeline<T> implements Validator<T> {
    private readonly validators: Validator<T>[] = [];

    add(validator: Validator<T>): this {
        this.validators.push(validator);
        return this;
    }

    validate(input: T): ValidationResult<T> {
        let currentData = input;
        const allErrors: ValidationErrorDetail[] = [];

        for (const validator of this.validators) {
            const result = validator.validate(currentData);

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
}

export class ZodValidationHandler<T> implements Validator<T> {
    constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) { }

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
            data: result.data as T
        };
    }
}

export class CustomValidationHandler<T> implements Validator<T> {
    constructor(
        private readonly validateFn: (input: T) => { valid: boolean; error?: string; field?: string }
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
}

export function createValidationPipeline<T>(): ValidationPipeline<T> {
    return new ValidationPipeline<T>();
}

export function zodValidator<T>(schema: ZodType<T, ZodTypeDef, unknown>): ZodValidationHandler<T> {
    return new ZodValidationHandler(schema);
}

export function customValidator<T>(
    validateFn: (input: T) => { valid: boolean; error?: string; field?: string }
): CustomValidationHandler<T> {
    return new CustomValidationHandler(validateFn);
}
