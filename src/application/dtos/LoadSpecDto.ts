import { z } from 'zod';

export const LoadSpecRequestSchema = z.object({
    filePath: z.string().optional(),
    content: z.string().optional(),
    format: z.enum(['yaml', 'json']).optional()
}).refine(
    data => data.filePath || data.content,
    { message: 'Either filePath or content must be provided' }
);

export type LoadSpecRequest = z.infer<typeof LoadSpecRequestSchema>;

export interface LoadSpecResponse {
    success: boolean;
    specification: {
        title: string;
        version: string;
        openApiVersion: string;
        servers: string[];
        pathCount: number;
    };
    loadedAt: Date;
    source: string;
}
