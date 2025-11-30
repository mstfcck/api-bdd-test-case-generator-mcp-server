import { z } from 'zod';

export const ListEndpointsRequestSchema = z.object({
    filter: z.object({
        method: z.string().optional(),
        tag: z.string().optional(),
        path: z.string().optional()
    }).optional()
});

export type ListEndpointsRequest = z.infer<typeof ListEndpointsRequestSchema>;

export interface EndpointInfo {
    path: string;
    method: string;
    operationId?: string;
    summary?: string;
    description?: string;
    tags: string[];
}

export interface ListEndpointsResponse {
    success: boolean;
    endpoints: EndpointInfo[];
    totalCount: number;
    groupedByTag?: Record<string, EndpointInfo[]>;
}
