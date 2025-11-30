import { Endpoint, OpenAPISpecification } from '../entities/index.js';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export interface ResolvedSchema {
    schema: SchemaObject;
    constraints: Constraints;
    examples: unknown[];
}

export interface Constraints {
    type?: string | string[];
    required?: string[];
    properties?: Record<string, Constraints>;

    // String constraints
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;

    // Number constraints
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number | boolean;
    exclusiveMaximum?: number | boolean;
    multipleOf?: number;

    // Array constraints
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;

    // Enum constraints
    enum?: unknown[];
    const?: unknown;

    // Complex schemas
    allOf?: Constraints[];
    oneOf?: Constraints[];
    anyOf?: Constraints[];
    not?: Constraints;
}

export interface AnalyzedParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    schema: ResolvedSchema;
    description?: string;
    example?: unknown;
}

export interface AnalyzedRequestBody {
    required: boolean;
    contentType: string;
    schema: ResolvedSchema;
    examples: Record<string, unknown>;
}

export interface AnalyzedResponse {
    statusCode: string;
    description: string;
    schema?: ResolvedSchema;
    examples: Record<string, unknown>;
    headers?: Record<string, unknown>;
    links?: LinkInfo[];
}

export interface LinkInfo {
    name: string;
    operationId?: string;
    operationRef?: string;
    description?: string;
    parameters?: Record<string, string>;
}

export interface RelatedEndpoint {
    relationship: 'link' | 'callback' | 'webhook';
    path: string;
    method: string;
    via: string;
}

export interface EndpointAnalysis {
    path: string;
    method: string;
    operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];

    parameters: AnalyzedParameter[];
    requestBody?: AnalyzedRequestBody;
    responses: Map<string, AnalyzedResponse>;
    security: Array<OpenAPIV3.SecurityRequirementObject | OpenAPIV3_1.SecurityRequirementObject>;
    callbacks?: Record<string, unknown>;
    links: LinkInfo[];
    relatedEndpoints: RelatedEndpoint[];
}

export interface IEndpointAnalyzer {
    /**
     * Analyze an endpoint in depth
     */
    analyze(
        spec: OpenAPISpecification,
        endpoint: Endpoint
    ): EndpointAnalysis;

    /**
     * Find related endpoints (via links, callbacks, etc.)
     */
    findRelatedEndpoints(
        spec: OpenAPISpecification,
        endpoint: Endpoint
    ): RelatedEndpoint[];
}
