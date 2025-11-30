import { z } from 'zod';
import { ScenarioType } from '../../domain/value-objects/index.js';

export const GenerateScenariosRequestSchema = z.object({
    scenarioTypes: z.array(z.nativeEnum(ScenarioType)).optional(),
    includeBackground: z.boolean().optional()
});

export type GenerateScenariosRequest = z.infer<typeof GenerateScenariosRequestSchema>;

export interface ScenarioSummary {
    name: string;
    type: ScenarioType;
    scenarioType: 'Scenario' | 'Scenario Outline';
    stepCount: number;
    exampleCount?: number;
    tags: string[];
}

export interface GenerateScenariosResponse {
    success: boolean;
    scenarios: ScenarioSummary[];
    totalCount: number;
    groupedByType: Record<ScenarioType, number>;
}
