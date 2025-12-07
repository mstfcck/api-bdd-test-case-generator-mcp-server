import { DomainError } from './DomainError.js';

export class StateError extends DomainError {
    constructor(message: string) {
        super(message, 'STATE_ERROR');
    }
}
