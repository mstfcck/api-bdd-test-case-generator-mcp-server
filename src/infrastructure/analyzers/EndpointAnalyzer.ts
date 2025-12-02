import { injectable, inject } from 'inversify';
import { IEndpointAnalyzer, IRefResolver, type EndpointAnalysis, type AnalyzedParameter, type AnalyzedRequestBody, type AnalyzedResponse, type ResolvedSchema, type LinkInfo, type RelatedEndpoint } from '../../domain/services/index.js';
import { OpenAPISpecification, Endpoint } from '../../domain/entities/index.js';
import { TYPES } from '../../di/types.js';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
type LinkObject = OpenAPIV3.LinkObject | OpenAPIV3_1.LinkObject;
type CallbackObject = OpenAPIV3.CallbackObject | OpenAPIV3_1.CallbackObject;
type PathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;

interface ResponseLinkDetail {
    name: string;
    statusCode: string;
    link: LinkObject;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
type HttpMethod = typeof HTTP_METHODS[number];

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

        const relationships = this.collectRelationshipData(endpoint, document);
        const links = relationships.links;
        const relatedEndpoints = relationships.relatedEndpoints;

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
        const document = spec.getDocument();
        return this.collectRelationshipData(endpoint, document).relatedEndpoints;
    }

    private collectRelationshipData(endpoint: Endpoint, document: OpenAPIDocument): { links: LinkInfo[]; relatedEndpoints: RelatedEndpoint[] } {
        const responseLinks = this.collectResponseLinks(endpoint.getResponses(), document);
        const links = this.mapToLinkInfo(responseLinks);
        const relatedFromLinks = this.mapRelatedEndpointsFromLinks(responseLinks, document);
        const relatedFromCallbacks = this.extractCallbackRelationships(
            endpoint.getOperation().callbacks as CallbackObject | undefined,
            document
        );

        return {
            links,
            relatedEndpoints: [...relatedFromLinks, ...relatedFromCallbacks]
        };
    }

    private collectResponseLinks(
        responses: Record<string, unknown> | undefined,
        document: OpenAPIDocument
    ): ResponseLinkDetail[] {
        if (!responses) {
            return [];
        }

        const collected: ResponseLinkDetail[] = [];

        for (const [statusCode, response] of Object.entries(responses)) {
            const resolvedResponse = this.resolveResponse(response, document);
            const links = resolvedResponse.links;
            if (!links) {
                continue;
            }

            for (const [linkName, linkValue] of Object.entries(links)) {
                const resolvedLink = this.resolveLink(linkValue as any, document);
                if (!resolvedLink) {
                    continue;
                }
                collected.push({
                    name: linkName,
                    statusCode,
                    link: resolvedLink
                });
            }
        }

        return collected;
    }

    private mapToLinkInfo(entries: ResponseLinkDetail[]): LinkInfo[] {
        return entries.map(({ name, link }) => ({
            name,
            operationId: link.operationId,
            operationRef: link.operationRef,
            description: link.description,
            parameters: this.normalizeLinkParameters(link.parameters)
        }));
    }

    private mapRelatedEndpointsFromLinks(entries: ResponseLinkDetail[], document: OpenAPIDocument): RelatedEndpoint[] {
        const related: RelatedEndpoint[] = [];

        for (const entry of entries) {
            const target = this.resolveLinkTarget(entry.link, document);
            if (!target) {
                continue;
            }

            related.push({
                relationship: target.relationship,
                path: target.path,
                method: target.method,
                via: `${entry.name} link in ${entry.statusCode} response`
            });
        }

        return related;
    }

    private extractCallbackRelationships(
        callbacks: CallbackObject | undefined,
        document: OpenAPIDocument
    ): RelatedEndpoint[] {
        if (!callbacks) {
            return [];
        }

        const related: RelatedEndpoint[] = [];

        for (const [callbackName, callbackValue] of Object.entries(callbacks)) {
            const resolvedCallback = this.resolveCallback(callbackValue as any, document);
            if (!resolvedCallback) {
                continue;
            }

            for (const [expression, pathItem] of Object.entries(resolvedCallback)) {
                const resolvedPathItem = this.resolvePathItem(pathItem as any, document);
                const methods = this.extractHttpMethods(resolvedPathItem);
                for (const method of methods) {
                    related.push({
                        relationship: 'callback',
                        path: expression,
                        method,
                        via: `${callbackName} callback`
                    });
                }
            }
        }

        return related;
    }

    private resolveLinkTarget(
        link: LinkObject,
        document: OpenAPIDocument
    ): { path: string; method: string; relationship: 'link' | 'webhook' } | null {
        if (link.operationId) {
            const located = this.findOperationById(document, link.operationId);
            if (located) {
                return located;
            }
        }

        if (link.operationRef) {
            const parsed = this.parseOperationRef(link.operationRef);
            if (parsed) {
                return parsed;
            }
        }

        return null;
    }

    private findOperationById(
        document: OpenAPIDocument,
        operationId: string
    ): { path: string; method: string; relationship: 'link' | 'webhook' } | null {
        const fromPaths = this.searchOperations(document.paths || {}, 'link', document, operationId);
        if (fromPaths) {
            return fromPaths;
        }

        const webhooks = (document as any).webhooks as Record<string, unknown> | undefined;
        if (webhooks) {
            return this.searchOperations(webhooks, 'webhook', document, operationId);
        }

        return null;
    }

    private searchOperations(
        collection: Record<string, unknown>,
        relationship: 'link' | 'webhook',
        document: OpenAPIDocument,
        operationId: string
    ): { path: string; method: string; relationship: 'link' | 'webhook' } | null {
        for (const [pathKey, pathItem] of Object.entries(collection)) {
            const resolvedPathItem = this.resolvePathItem(pathItem as any, document);
            if (!resolvedPathItem) {
                continue;
            }

            for (const method of HTTP_METHODS) {
                const operation = (resolvedPathItem as any)[method] as (OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject | undefined);
                if (operation?.operationId === operationId) {
                    return {
                        relationship,
                        path: relationship === 'link' ? pathKey : pathKey,
                        method: method.toUpperCase()
                    };
                }
            }
        }

        return null;
    }

    private parseOperationRef(
        ref: string
    ): { path: string; method: string; relationship: 'link' | 'webhook' } | null {
        const pointerIndex = ref.indexOf('#/');
        if (pointerIndex === -1) {
            return null;
        }

        const pointer = ref.substring(pointerIndex + 2);
        const segments = pointer.split('/').map(segment => this.decodePointerSegment(segment));
        const root = segments.shift();
        if (!root) {
            return null;
        }

        if (root === 'paths' || root === 'webhooks') {
            const targetPath = segments.shift();
            const methodSegment = segments.shift();

            if (!targetPath || !methodSegment) {
                return null;
            }

            return {
                relationship: root === 'webhooks' ? 'webhook' : 'link',
                path: targetPath,
                method: methodSegment.toUpperCase()
            };
        }

        return null;
    }

    private resolveResponse(response: unknown, document: OpenAPIDocument): ResponseObject {
        if (this.isRef(response)) {
            return this.refResolver.resolve<ResponseObject>((response as any).$ref, document);
        }
        return (response || { description: '' }) as ResponseObject;
    }

    private resolveLink(link: unknown, document: OpenAPIDocument): LinkObject | null {
        if (!link) {
            return null;
        }
        if (this.isRef(link)) {
            return this.refResolver.resolve<LinkObject>((link as any).$ref, document);
        }
        return link as LinkObject;
    }

    private resolveCallback(callback: unknown, document: OpenAPIDocument): CallbackObject | undefined {
        if (!callback) {
            return undefined;
        }
        if (this.isRef(callback)) {
            return this.refResolver.resolve<CallbackObject>((callback as any).$ref, document);
        }
        return callback as CallbackObject;
    }

    private resolvePathItem(pathItem: unknown, document: OpenAPIDocument): PathItemObject | undefined {
        if (!pathItem) {
            return undefined;
        }
        if (this.isRef(pathItem)) {
            return this.refResolver.resolve<PathItemObject>((pathItem as any).$ref, document);
        }
        return pathItem as PathItemObject;
    }

    private extractHttpMethods(pathItem: PathItemObject | undefined): string[] {
        if (!pathItem) {
            return [];
        }

        const methods: string[] = [];
        for (const method of HTTP_METHODS) {
            if ((pathItem as any)[method]) {
                methods.push(method.toUpperCase());
            }
        }

        return methods;
    }

    private normalizeLinkParameters(parameters?: Record<string, unknown>): Record<string, string> | undefined {
        if (!parameters) {
            return undefined;
        }

        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(parameters)) {
            normalized[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return normalized;
    }

    private decodePointerSegment(segment: string): string {
        return segment.replace(/~1/g, '/').replace(/~0/g, '~');
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
