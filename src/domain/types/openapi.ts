/**
 * Centralized OpenAPI type definitions for the domain layer.
 * All OpenAPI-related type aliases are defined here to prevent duplication
 * across entities, services, and infrastructure.
 */
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// Document types
export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

// Schema types
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
export type SchemaOrRef = SchemaObject | ReferenceObject;

// Operation types
export type OperationObject = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
export type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
export type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
export type ResponsesObject = OpenAPIV3.ResponsesObject | OpenAPIV3_1.ResponsesObject;
export type SecurityRequirementObject = OpenAPIV3.SecurityRequirementObject | OpenAPIV3_1.SecurityRequirementObject;
export type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject;

// Structural types
export type PathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;
export type ComponentsObject = OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject;
export type LinkObject = OpenAPIV3.LinkObject | OpenAPIV3_1.LinkObject;
export type CallbackObject = OpenAPIV3.CallbackObject | OpenAPIV3_1.CallbackObject;

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
export type HttpMethodLower = typeof HTTP_METHODS[number];
