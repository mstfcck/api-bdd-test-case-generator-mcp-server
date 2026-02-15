import { injectable } from 'inversify';
import { IDataGenerator, ResolvedSchema, type GeneratedValue, type Constraints } from '../../domain/services/index.js';

@injectable()
export class DataGenerator implements IDataGenerator {
    generateValid(schema: ResolvedSchema, requiredOnly: boolean = false): GeneratedValue {
        return this.generateValue(schema, true, requiredOnly);
    }

    generateInvalid(schema: ResolvedSchema): GeneratedValue {
        // Simple strategy: return a type mismatch or violate constraints
        const type = schema.constraints.type;

        if (type === 'string') return 123;
        if (type === 'number' || type === 'integer') return 'invalid_number';
        if (type === 'boolean') return 'not_a_boolean';
        if (type === 'array') return { not: 'an array' };
        if (type === 'object') return 'not_an_object';

        return null;
    }

    generateIdentifier(schema: ResolvedSchema): GeneratedValue {
        const type = schema.constraints.type;
        if (type === 'integer' || type === 'number') {
            return 999999;
        }
        if (type === 'string') {
            if (schema.constraints.format === 'uuid') {
                return '00000000-0000-0000-0000-000000000000';
            }
            return 'non_existent_id';
        }
        return 'unknown_id';
    }

    private generateValue(schema: ResolvedSchema, isValid: boolean, requiredOnly: boolean): GeneratedValue {
        const { type, enum: enumValues, format } = schema.constraints;

        if (enumValues && enumValues.length > 0) {
            return enumValues[0] as GeneratedValue;
        }

        switch (type) {
            case 'string':
                return this.generateString(format);
            case 'integer':
            case 'number':
                return this.generateNumber(schema.constraints);
            case 'boolean':
                return true;
            case 'array':
                return this.generateArray(schema, isValid, requiredOnly);
            case 'object':
                return this.generateObject(schema, isValid, requiredOnly);
            default:
                return 'sample_value';
        }
    }

    private generateString(format?: string): string {
        if (format === 'date') return '2023-01-01';
        if (format === 'date-time') return '2023-01-01T00:00:00Z';
        if (format === 'email') return 'test@example.com';
        if (format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
        if (format === 'uri') return 'https://example.com';
        return 'string_value';
    }

    private generateNumber(constraints: Constraints): number {
        if (constraints.minimum !== undefined) return constraints.minimum;
        if (constraints.maximum !== undefined) return constraints.maximum;
        return 1;
    }

    private generateArray(schema: ResolvedSchema, isValid: boolean, requiredOnly: boolean): GeneratedValue[] {
        const itemConstraints = schema.constraints.items;
        if (!itemConstraints) return [];

        const resolvedItem: ResolvedSchema = {
            schema: {} as Record<string, unknown>,
            constraints: itemConstraints,
            examples: []
        };

        return [this.generateValue(resolvedItem, isValid, requiredOnly)];
    }

    private generateObject(schema: ResolvedSchema, isValid: boolean, requiredOnly: boolean): Record<string, GeneratedValue> {
        const props = schema.constraints.properties || {};
        const required = schema.constraints.required || [];
        const result: Record<string, GeneratedValue> = {};

        for (const [key, propConstraints] of Object.entries(props)) {
            if (requiredOnly && !required.includes(key)) {
                continue;
            }

            const resolvedProp: ResolvedSchema = {
                schema: {} as Record<string, unknown>,
                constraints: propConstraints,
                examples: []
            };

            result[key] = this.generateValue(resolvedProp, isValid, requiredOnly);
        }

        return result;
    }
}
