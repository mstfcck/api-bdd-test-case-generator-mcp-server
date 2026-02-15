import 'reflect-metadata';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';

describe('ScenarioType', () => {
    describe('Enum Values', () => {
        it('should have required_fields value', () => {
            expect(ScenarioType.REQUIRED_FIELDS).toBe('required_fields');
        });

        it('should have all_fields value', () => {
            expect(ScenarioType.ALL_FIELDS).toBe('all_fields');
        });

        it('should have validation_error value', () => {
            expect(ScenarioType.VALIDATION_ERROR).toBe('validation_error');
        });

        it('should have auth_error value', () => {
            expect(ScenarioType.AUTH_ERROR).toBe('auth_error');
        });

        it('should have not_found value', () => {
            expect(ScenarioType.NOT_FOUND).toBe('not_found');
        });

        it('should have edge_case value', () => {
            expect(ScenarioType.EDGE_CASE).toBe('edge_case');
        });
    });

    describe('Enum Completeness', () => {
        it('should have exactly 6 scenario types', () => {
            const values = Object.values(ScenarioType);
            expect(values).toHaveLength(6);
        });

        it('should contain all expected values', () => {
            const values = Object.values(ScenarioType);
            expect(values).toEqual(expect.arrayContaining([
                'required_fields',
                'all_fields',
                'validation_error',
                'auth_error',
                'not_found',
                'edge_case'
            ]));
        });
    });
});
