import { ResolvedSchema } from './IEndpointAnalyzer.js';

export interface IDataGenerator {
    /**
     * Generate valid data based on the schema
     * @param schema The schema to generate data for
     * @param requiredOnly If true, only generate data for required fields
     */
    generateValid(schema: ResolvedSchema, requiredOnly?: boolean): any;

    /**
     * Generate invalid data based on the schema (violating constraints)
     * @param schema The schema to generate data for
     */
    generateInvalid(schema: ResolvedSchema): any;

    /**
     * Generate a value that satisfies the type but is likely "non-existent" (e.g. random UUID)
     */
    generateIdentifier(schema: ResolvedSchema): any;
}
