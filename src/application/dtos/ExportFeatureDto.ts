import { z } from 'zod';

export const ExportFeatureRequestSchema = z.object({
    format: z.enum(['gherkin', 'json', 'markdown']).default('gherkin'),
    outputPath: z.string().optional(),
    includeComments: z.boolean().default(true)
});

export type ExportFeatureRequest = z.infer<typeof ExportFeatureRequestSchema>;

export interface ExportFeatureResponse {
    success: boolean;
    format: 'gherkin' | 'json' | 'markdown';
    content: string;
    filePath?: string;
    stats: {
        featureName: string;
        scenarioCount: number;
        totalSteps: number;
        size: number;
    };
}
