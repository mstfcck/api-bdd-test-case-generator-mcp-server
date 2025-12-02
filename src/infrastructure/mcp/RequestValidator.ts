import { injectable } from 'inversify';
import { z, ZodSchema, ZodType } from 'zod';
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

@injectable()
export class RequestValidator {
    validate<T>(schema: ZodType<T, any, any>, input: unknown): T {
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
