import type {
    OperationObject,
    ParameterObject,
    RequestBodyObject,
    ResponsesObject,
    SecurityRequirementObject
} from '../types/index.js';
import { HTTPMethod } from '../value-objects/index.js';
import { ValidationError } from '../errors/index.js';

export class Endpoint {
    private constructor(
        private readonly path: string,
        private readonly method: HTTPMethod,
        private readonly operation: OperationObject
    ) { }

    static create(path: string, method: string, operation: OperationObject): Endpoint {
        if (!path || !path.startsWith('/')) {
            throw new ValidationError('Invalid endpoint path', 'path', path);
        }

        const httpMethod = HTTPMethod.create(method);
        return new Endpoint(path, httpMethod, operation);
    }

    getPath(): string {
        return this.path;
    }

    getMethod(): HTTPMethod {
        return this.method;
    }

    getOperation(): OperationObject {
        return this.operation;
    }

    getOperationId(): string | undefined {
        return this.operation.operationId;
    }

    getSummary(): string | undefined {
        return this.operation.summary;
    }

    getDescription(): string | undefined {
        return this.operation.description;
    }

    getTags(): string[] {
        return this.operation.tags || [];
    }

    getParameters(): ParameterObject[] {
        return (this.operation.parameters || []) as ParameterObject[];
    }

    getRequestBody(): RequestBodyObject | undefined {
        return this.operation.requestBody as RequestBodyObject | undefined;
    }

    getResponses(): ResponsesObject | undefined {
        return this.operation.responses;
    }

    getSecurity(): SecurityRequirementObject[] {
        return (this.operation.security || []) as SecurityRequirementObject[];
    }

    isDeprecated(): boolean {
        return this.operation.deprecated === true;
    }

    hasRequestBody(): boolean {
        return !!this.operation.requestBody;
    }

    hasParameters(): boolean {
        return !!this.operation.parameters && this.operation.parameters.length > 0;
    }

    hasSecurity(): boolean {
        return !!this.operation.security && this.operation.security.length > 0;
    }

    getIdentifier(): string {
        return `${this.method.getValue()} ${this.path}`;
    }

    equals(other: Endpoint): boolean {
        return this.path === other.path && this.method.equals(other.method);
    }
}
