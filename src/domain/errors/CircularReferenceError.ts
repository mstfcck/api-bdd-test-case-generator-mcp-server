import { DomainError } from './DomainError.js';

export class CircularReferenceError extends DomainError {
    constructor(
        message: string,
        public readonly referencePath: string[],
        public readonly circularRef: string
    ) {
        super(message, 'CIRCULAR_REFERENCE');
    }

    toJSON() {
        return {
            ...super.toJSON(),
            referencePath: this.referencePath,
            circularRef: this.circularRef
        };
    }
}
