import { injectable } from 'inversify';
import { ZodType, type ZodTypeDef } from 'zod';
import { ValidationPipeline, zodValidator } from '../../shared/index.js';
import {
    LoadSpecRequestSchema,
    ListEndpointsRequestSchema,
    AnalyzeEndpointRequestSchema,
    GenerateScenariosRequestSchema,
    ExportFeatureRequestSchema,
    LoadSpecRequest,
    ListEndpointsRequest,
    AnalyzeEndpointRequest,
    GenerateScenariosRequest,
    ExportFeatureRequest
} from '../../application/dtos/index.js';

/**
 * @deprecated The MCP SDK now handles tool input validation via Zod schemas
 * passed directly to registerTool(). This class is retained for non-MCP use.
 */
@injectable()
export class RequestValidator {
    validate<T>(schema: ZodType<T, ZodTypeDef, unknown>, input: unknown): T {
        const pipeline = new ValidationPipeline<T>();
        pipeline.add(zodValidator(schema));

        const result = pipeline.validate(input as T);

        if (!result.success) {
            const errors = result.errors?.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Validation failed: ${errors}`);
        }

        return result.data!;
    }

    validateLoadSpec(input: unknown): LoadSpecRequest {
        return this.validate(LoadSpecRequestSchema, input);
    }

    validateListEndpoints(input: unknown): ListEndpointsRequest {
        return this.validate(ListEndpointsRequestSchema, input);
    }

    validateAnalyzeEndpoint(input: unknown): AnalyzeEndpointRequest {
        return this.validate(AnalyzeEndpointRequestSchema, input);
    }

    validateGenerateScenarios(input: unknown): GenerateScenariosRequest {
        return this.validate(GenerateScenariosRequestSchema, input);
    }

    validateExportFeature(input: unknown): ExportFeatureRequest {
        return this.validate(ExportFeatureRequestSchema, input);
    }
}
