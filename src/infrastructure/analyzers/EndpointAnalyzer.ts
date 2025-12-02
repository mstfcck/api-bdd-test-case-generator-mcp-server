import { injectable, inject } from 'inversify';
import { IEndpointAnalyzer, IRefResolver, type EndpointAnalysis, type AnalyzedParameter, type AnalyzedRequestBody, type AnalyzedResponse, type ResolvedSchema, type Constraints, type LinkInfo, type RelatedEndpoint } from '../../domain/services/index.js';
import { OpenAPISpecification, Endpoint } from '../../domain/entities/index.js';
import { TYPES } from '../../di/types.js';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
type LinkObject = OpenAPIV3.LinkObject | OpenAPIV3_1.LinkObject;
type CallbackObject = OpenAPIV3.CallbackObject | OpenAPIV3_1.CallbackObject;
type PathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
type ResponsesObject = OpenAPIV3.ResponsesObject | OpenAPIV3_1.ResponsesObject;
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type CallbackMap = Record<string, CallbackObject | ReferenceObject>;

type LinkOrWebhookRelationship = Extract<RelatedEndpoint['relationship'], 'link' | 'webhook'>;

interface RelationshipTarget {
    path: string;
    method: string;
    relationship: LinkOrWebhookRelationship;
}

interface RelationshipCollection {
    links: LinkInfo[];
    relatedEndpoints: RelatedEndpoint[];
}

interface ResponseLinkDetail {
    name: string;
    statusCode: string;
    link: LinkObject;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

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
        const responses = this.analyzeResponses(endpoint.getResponses(), document);

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

    private collectRelationshipData(endpoint: Endpoint, document: OpenAPIDocument): RelationshipCollection {
        const responseLinks = this.collectResponseLinks(endpoint.getResponses(), document);
        const links = this.mapToLinkInfo(responseLinks);
        const relatedFromLinks = this.mapRelatedEndpointsFromLinks(responseLinks, document);
        const relatedFromCallbacks = this.extractCallbackRelationships(
            endpoint.getOperation().callbacks as CallbackMap | undefined,
            document
        );

        return {
            links,
            relatedEndpoints: [...relatedFromLinks, ...relatedFromCallbacks]
        };
    }

    private collectResponseLinks(
        responses: ResponsesObject | undefined,
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
        callbacks: CallbackMap | undefined,
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
    ): RelationshipTarget | null {
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
    ): RelationshipTarget | null {
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
        relationship: LinkOrWebhookRelationship,
        document: OpenAPIDocument,
        operationId: string
    ): RelationshipTarget | null {
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
                        path: pathKey,
                        method: method.toUpperCase()
                    };
                }
            }
        }

        return null;
    }

    private parseOperationRef(
        ref: string
    ): RelationshipTarget | null {
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

    private resolveResponse(
        response: ResponseObject | ReferenceObject | undefined,
        document: OpenAPIDocument
    ): ResponseObject {
        if (!response) {
            return { description: '' };
        }
        if (this.isRef(response)) {
            return this.refResolver.resolve<ResponseObject>(response.$ref, document);
        }
        return response;
    }

    private resolveLink(
        link: LinkObject | ReferenceObject | undefined,
        document: OpenAPIDocument
    ): LinkObject | null {
        if (!link) {
            return null;
        }
        if (this.isRef(link)) {
            return this.refResolver.resolve<LinkObject>(link.$ref, document);
        }
        return link;
    }

    private resolveCallback(
        callback: CallbackObject | ReferenceObject | undefined,
        document: OpenAPIDocument
    ): CallbackObject | undefined {
        if (!callback) {
            return undefined;
        }
        if (this.isRef(callback)) {
            return this.refResolver.resolve<CallbackObject>(callback.$ref, document);
        }
        return callback;
    }

    private resolvePathItem(
        pathItem: PathItemObject | ReferenceObject | undefined,
        document: OpenAPIDocument
    ): PathItemObject | undefined {
        if (!pathItem) {
            return undefined;
        }
        if (this.isRef(pathItem)) {
            return this.refResolver.resolve<PathItemObject>(pathItem.$ref, document);
        }
        return pathItem;
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

    private analyzeParameters(params: ParameterObject[], spec: OpenAPIDocument): AnalyzedParameter[] {
        return params.map(param => {
            const resolved = this.resolveParameter(param, spec);
            const schema = this.resolveParameterSchema(resolved, spec);

            return {
                name: resolved.name,
                in: resolved.in as 'path' | 'query' | 'header' | 'cookie',
                required: resolved.required ?? resolved.in === 'path',
                schema,
                description: resolved.description,
                example: resolved.example
            };
        });
    }

    private analyzeRequestBody(requestBody: RequestBodyObject | ReferenceObject, spec: OpenAPIDocument): AnalyzedRequestBody {
        const resolved = this.isRef(requestBody) ? this.refResolver.resolve<RequestBodyObject>(requestBody.$ref, spec) : requestBody;
        const content = resolved.content ?? {};
        const contentType = Object.keys(content)[0] || 'application/json';
        const mediaType = content[contentType] ?? {};

        const schema = this.resolveSchema(mediaType.schema as SchemaObject | ReferenceObject | undefined, spec);

        return {
            required: resolved.required ?? false,
            contentType,
            schema,
            examples: mediaType.examples || {}
        };
    }

    private analyzeResponses(responses: ResponsesObject | undefined, spec: OpenAPIDocument): Map<string, AnalyzedResponse> {
        const result = new Map<string, AnalyzedResponse>();
        const responseEntries = responses ? Object.entries(responses) : [];

        for (const [statusCode, response] of responseEntries) {
            const resolved = this.resolveResponse(response as ResponseObject | ReferenceObject, spec);
            const content = resolved.content ?? {};
            const contentType = Object.keys(content)[0];
            const schema = contentType
                ? this.resolveSchema(content[contentType].schema as SchemaObject | ReferenceObject | undefined, spec)
                : undefined;

            result.set(statusCode, {
                statusCode,
                description: resolved.description || '',
                schema,
                examples: contentType ? (content[contentType].examples || {}) : {},
                headers: resolved.headers,
                links: []
            });
        }

        return result;
    }

    private resolveParameter(param: ParameterObject | ReferenceObject, spec: OpenAPIDocument): ParameterObject {
        return this.isRef(param) ? this.refResolver.resolve<ParameterObject>(param.$ref, spec) : param;
    }

    private resolveParameterSchema(param: ParameterObject, spec: OpenAPIDocument): ResolvedSchema {
        const schema: SchemaObject = param.schema
            ? this.refResolver.resolveSchema(param.schema as SchemaObject | ReferenceObject, spec)
            : { type: 'string' };

        return {
            schema,
            constraints: this.extractConstraints(schema),
            examples: param.examples ? Object.values(param.examples) : []
        };
    }

    private resolveSchema(schema: SchemaObject | ReferenceObject | undefined, spec: OpenAPIDocument): ResolvedSchema {
        if (!schema) {
            const fallback: SchemaObject = { type: 'object' };
            return {
                schema: fallback,
                constraints: {},
                examples: []
            };
        }

        const resolved = this.isRef(schema)
            ? this.refResolver.resolveSchema(schema, spec)
            : schema;

        return {
            schema: resolved,
            constraints: this.extractConstraints(resolved),
            examples: []
        };
    }

    private extractConstraints(schema: SchemaObject): Constraints {
        return {
            type: schema.type,
            required: schema.required,
            properties: schema.properties as Record<string, Constraints> | undefined,
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

    private isRef(obj: unknown): obj is ReferenceObject {
        return !!(obj && typeof obj === 'object' && '$ref' in obj);
    }
}
