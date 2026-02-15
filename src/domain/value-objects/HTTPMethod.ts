import { ValidationError } from '../errors/index.js';

export class HTTPMethod {
    private static readonly VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

    private constructor(private readonly value: string) { }

    static create(method: string): HTTPMethod {
        const normalized = method.toUpperCase();
        if (!this.VALID_METHODS.includes(normalized as typeof this.VALID_METHODS[number])) {
            throw new ValidationError(`Invalid HTTP method: ${method}`, 'method', method);
        }
        return new HTTPMethod(normalized);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: HTTPMethod): boolean {
        return this.value === other.value;
    }

    isIdempotent(): boolean {
        return ['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'].includes(this.value);
    }

    isSafe(): boolean {
        return ['GET', 'HEAD', 'OPTIONS'].includes(this.value);
    }

    toString(): string {
        return this.value;
    }
}
