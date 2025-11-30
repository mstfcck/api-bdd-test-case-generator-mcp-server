import { z } from 'zod';
import type { EndpointAnalysis } from '../../domain/services/index.js';

export const AnalyzeEndpointRequestSchema = z.object({
    path: z.string().min(1),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
});

export type AnalyzeEndpointRequest = z.infer<typeof AnalyzeEndpointRequestSchema>;

export interface AnalyzeEndpointResponse {
    success: boolean;
    analysis: EndpointAnalysis;
    insights: {
        hasAuthentication: boolean;
        hasRequestBody: boolean;
        hasPathParameters: boolean;
        hasQueryParameters: boolean;
        responseCount: number;
        relatedEndpointCount: number;
    };
}
