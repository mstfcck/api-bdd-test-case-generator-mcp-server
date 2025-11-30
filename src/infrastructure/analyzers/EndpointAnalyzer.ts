import { injectable, inject } from 'inversify';
import { IEndpointAnalyzer, IRefResolver, type EndpointAnalysis, type AnalyzedParameter, type AnalyzedRequestBody, type AnalyzedResponse, type ResolvedSchema, type LinkInfo, type RelatedEndpoint } from '../../domain/services/index.js';
import { OpenAPISpecification, Endpoint } from '../../domain/entities/index.js';
import { TYPES } from '../../di/types.js';

@injectable()
export class EndpointAnalyzer implements IEndpointAnalyzer {
    constructor(
        @inject(TYPES.IRefResolver) private refResolver: IRefResolver
    ) { }

    analyze(spec: OpenAPISpecification, endpoint: Endpoint): EndpointAnalysis {
        const document = spec.getDocument();
        const operation = endpoint.getOperation();

        // Analyze parameters
        const parameters = this.analyzeParameters(endpoint.getParameters(), document);

        // Analyze request body
        const requestBody = endpoint.hasRequestBody()
            ? this.analyzeRequestBody(endpoint.getRequestBody()!, document)
            : undefined;

        // Analyze responses
        const responses = this.analyzeResponses(endpoint.getResponses() || {}, document);

        // Get security
        const security = endpoint.getSecurity();

        // Extract links (simplified)
        const links: LinkInfo[] = [];

        // Find related endpoints (simplified)
        const relatedEndpoints: RelatedEndpoint[] = [];

        return {
            path: endpoint.getPath(),
            method: endpoint.getMethod().getValue(),
            operation,
            operationId: endpoint.getOperationId(),
            summary: endpoint.getSummary(),
            description: endpoint.getDescription(),
            tags: endpoint.getTags(),
            parameters,
            requestBody,
            responses,
            security,
            callbacks: operation.callbacks,
            links,
            relatedEndpoints
        };
    }

    findRelatedEndpoints(spec: OpenAPISpecification, endpoint: Endpoint): RelatedEndpoint[] {
        // Simplified implementation
        return [];
    }

    private analyzeParameters(params: any[], spec: any): AnalyzedParameter[] {
        return params.map(param => {
            const resolved = this.resolveParameter(param, spec);
            const schema = this.resolveParameterSchema(resolved, spec);

            return {
                name: resolved.name,
                in: resolved.in as 'path' | 'query' | 'header' | 'cookie',
                required: resolved.required || resolved.in === 'path',
                schema,
                description: resolved.description,
                example: resolved.example
            };
        });
    }

    private analyzeRequestBody(requestBody: any, spec: any): AnalyzedRequestBody {
        const resolved = this.isRef(requestBody) ? this.refResolver.resolve(requestBody.$ref, spec) : requestBody;
        const content = resolved.content || {};
        const contentType = Object.keys(content)[0] || 'application/json';
        const mediaType = content[contentType] || {};

        const schema = this.resolveSchema(mediaType.schema, spec);

        return {
            required: resolved.required || false,
            contentType,
            schema,
            examples: mediaType.examples || {}
        };
    }

    private analyzeResponses(responses: any, spec: any): Map<string, AnalyzedResponse> {
        const result = new Map<string, AnalyzedResponse>();

        for (const [statusCode, response] of Object.entries(responses)) {
            const resolved = this.isRef(response) ? this.refResolver.resolve((response as any).$ref, spec) : response;
            const content = (resolved as any).content || {};
            const contentType = Object.keys(content)[0];
            const schema = contentType ? this.resolveSchema(content[contentType].schema, spec) : undefined;

            result.set(statusCode, {
                statusCode,
                description: (resolved as any).description || '',
                schema,
                examples: contentType ? (content[contentType].examples || {}) : {},
                headers: (resolved as any).headers,
                links: []
            });
        }

        return result;
    }

    private resolveParameter(param: any, spec: any): any {
        return this.isRef(param) ? this.refResolver.resolve(param.$ref, spec) : param;
    }

    private resolveParameterSchema(param: any, spec: any): ResolvedSchema {
        const schema = param.schema
            ? this.refResolver.resolveSchema(param.schema, spec)
            : { type: 'string' } as any;

        return {
            schema: schema as any,
            constraints: this.extractConstraints(schema),
            examples: param.examples ? Object.values(param.examples) : []
        };
    }

    private resolveSchema(schema: any, spec: any): ResolvedSchema {
        if (!schema) {
            return {
                schema: { type: 'object' } as any,
                constraints: {},
                examples: []
            };
        }

        const resolved = this.isRef(schema) ? this.refResolver.resolveSchema(schema, spec) : schema;

        return {
            schema: resolved,
            constraints: this.extractConstraints(resolved),
            examples: []
        };
    }

    private extractConstraints(schema: any): any {
        return {
            type: schema.type,
            required: schema.required,
            properties: schema.properties,
            minLength: schema.minLength,
            maxLength: schema.maxLength,
            pattern: schema.pattern,
            format: schema.format,
            minimum: schema.minimum,
            maximum: schema.maximum,
            minItems: schema.minItems,
            maxItems: schema.maxItems,
            enum: schema.enum
        };
    }

    private isRef(obj: any): boolean {
        return !!(obj && typeof obj === 'object' && '$ref' in obj);
    }
}
