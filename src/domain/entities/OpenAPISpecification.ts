import type {
    OpenAPIDocument,
    PathItemObject,
    ComponentsObject,
    SecuritySchemeObject
} from '../types/index.js';
import { ValidationError } from '../errors/index.js';

export interface SpecMetadata {
    title: string;
    version: string;
    description?: string;
    servers: string[];
    securitySchemes: string[];
    openApiVersion: string;
}

export class OpenAPISpecification {
    private constructor(
        private readonly document: OpenAPIDocument,
        private readonly metadata: SpecMetadata,
        private readonly source: string
    ) { }

    static create(document: OpenAPIDocument, source: string): OpenAPISpecification {
        const metadata = OpenAPISpecification.extractMetadata(document);
        return new OpenAPISpecification(document, metadata, source);
    }

    private static extractMetadata(doc: OpenAPIDocument): SpecMetadata {
        const info = doc.info;
        const servers = (doc.servers || []).map(s => s.url);
        const securitySchemes = doc.components?.securitySchemes
            ? Object.keys(doc.components.securitySchemes)
            : [];

        return {
            title: info.title,
            version: info.version,
            description: info.description,
            servers,
            securitySchemes,
            openApiVersion: doc.openapi
        };
    }

    getDocument(): OpenAPIDocument {
        return this.document;
    }

    getMetadata(): SpecMetadata {
        return this.metadata;
    }

    getSource(): string {
        return this.source;
    }

    getTitle(): string {
        return this.metadata.title;
    }

    getVersion(): string {
        return this.metadata.version;
    }

    getOpenApiVersion(): string {
        return this.metadata.openApiVersion;
    }

    hasPath(path: string): boolean {
        return !!this.document.paths?.[path];
    }

    getPath(path: string): PathItemObject | undefined {
        return this.document.paths?.[path] as PathItemObject | undefined;
    }

    getAllPaths(): string[] {
        return Object.keys(this.document.paths || {});
    }

    getComponents(): ComponentsObject | undefined {
        return this.document.components;
    }

    getSecuritySchemes(): Record<string, SecuritySchemeObject> | undefined {
        return this.document.components?.securitySchemes as Record<string, SecuritySchemeObject> | undefined;
    }

    validate(): void {
        if (!this.document.openapi) {
            throw new ValidationError('Missing openapi version');
        }

        if (!this.document.info?.title) {
            throw new ValidationError('Missing info.title');
        }

        if (!this.document.info?.version) {
            throw new ValidationError('Missing info.version');
        }

        if (!this.document.paths || Object.keys(this.document.paths).length === 0) {
            throw new ValidationError('No paths defined in specification');
        }
    }
}
