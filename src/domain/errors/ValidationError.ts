import { DomainError } from './DomainError.js';

export class ValidationError extends DomainError {
    constructor(
        message: string,
        public readonly field?: string,
        public readonly value?: unknown,
        public readonly constraints?: Record<string, string>
    ) {
        super(message, 'VALIDATION_ERROR');
    }

    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
            value: this.value,
            constraints: this.constraints
        };
    }
}
