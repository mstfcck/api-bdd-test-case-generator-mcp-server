import { ResolvedSchema } from './IEndpointAnalyzer.js';

/**
 * Data value that can be generated: primitives, arrays, objects, or null.
 */
export type GeneratedValue = string | number | boolean | null | GeneratedValue[] | { [key: string]: GeneratedValue };

export interface IDataGenerator {
    /**
     * Generate valid data based on the schema
     * @param schema The schema to generate data for
     * @param requiredOnly If true, only generate data for required fields
     */
    generateValid(schema: ResolvedSchema, requiredOnly?: boolean): GeneratedValue;

    /**
     * Generate invalid data based on the schema (violating constraints)
     * @param schema The schema to generate data for
     */
    generateInvalid(schema: ResolvedSchema): GeneratedValue;

    /**
     * Generate a value that satisfies the type but is likely "non-existent" (e.g. random UUID)
     */
    generateIdentifier(schema: ResolvedSchema): GeneratedValue;
}
