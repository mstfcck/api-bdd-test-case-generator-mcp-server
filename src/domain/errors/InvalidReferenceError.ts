import { DomainError } from './DomainError.js';

export class InvalidReferenceError extends DomainError {
    constructor(
        message: string,
        public readonly reference: string,
        public readonly reason?: string
    ) {
        super(message, 'INVALID_REFERENCE');
    }

    toJSON() {
        return {
            ...super.toJSON(),
            reference: this.reference,
            reason: this.reason
        };
    }
}
