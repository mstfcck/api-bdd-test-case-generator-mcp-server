import { DomainError } from './DomainError.js';

export class SpecificationNotFoundError extends DomainError {
    constructor(
        message: string,
        public readonly filePath?: string
    ) {
        super(message, 'SPECIFICATION_NOT_FOUND');
    }

    toJSON() {
        return {
            ...super.toJSON(),
            filePath: this.filePath
        };
    }
}
