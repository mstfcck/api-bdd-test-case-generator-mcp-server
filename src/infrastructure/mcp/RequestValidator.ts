import { injectable } from 'inversify';
import { z, ZodSchema } from 'zod';
import { ValidationPipeline, zodValidator } from '../../shared/index.js';
import {
    LoadSpecRequestSchema,
    ListEndpointsRequestSchema,
    AnalyzeEndpointRequestSchema,
    GenerateScenariosRequestSchema,
    ExportFeatureRequestSchema
} from '../../application/dtos/index.js';

@injectable()
export class RequestValidator {
    validate<T>(schema: ZodSchema<T>, input: unknown): T {
        const pipeline = new ValidationPipeline<T>();
        pipeline.add(zodValidator(schema));

        const result = pipeline.validate(input as T);

        if (!result.success) {
            const errors = result.errors?.map(e => `${e.field}: ${e.message}`).join(', ');
            throw new Error(`Validation failed: ${errors}`);
        }

        return result.data!;
    }

    validateLoadSpec(input: unknown) {
        return this.validate(LoadSpecRequestSchema, input);
    }

    validateListEndpoints(input: unknown) {
        return this.validate(ListEndpointsRequestSchema, input);
    }

    validateAnalyzeEndpoint(input: unknown) {
        return this.validate(AnalyzeEndpointRequestSchema, input);
    }

    validateGenerateScenarios(input: unknown) {
        return this.validate(GenerateScenariosRequestSchema, input);
    }

    validateExportFeature(input: unknown) {
        return this.validate(ExportFeatureRequestSchema, input);
    }
}
