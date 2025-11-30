import 'reflect-metadata';
import { ScenarioType, ScenarioTypeValue } from '../../../src/domain/value-objects/ScenarioType';

describe('ScenarioType', () => {
    describe('Valid Scenario Types', () => {
        test.each([
            'required_fields',
            'all_fields',
            'validation_error',
            'auth_error',
            'not_found',
            'edge_case',
        ])('should create ScenarioTypeValue with valid type: %s', (type) => {
            const scenarioType = ScenarioTypeValue.create(type);
            expect(scenarioType.getValue()).toBe(type);
        });
    });

    describe('Invalid Scenario Types', () => {
        test.each([
            'invalid_type',
            'happy_path',
            'VALIDATION_ERROR',
            '',
            ' ',
        ])('should throw Error for invalid type: %s', (type) => {
            expect(() => ScenarioTypeValue.create(type)).toThrow(Error);
            expect(() => ScenarioTypeValue.create(type)).toThrow(`Invalid scenario type: ${type}`);
        });
    });

    describe('Create from Enum', () => {
        it('should create from enum value', () => {
            const scenarioType = ScenarioTypeValue.fromEnum(ScenarioType.REQUIRED_FIELDS);
            expect(scenarioType.getValue()).toBe(ScenarioType.REQUIRED_FIELDS);
        });
    });

    describe('Equality', () => {
        it('should return true for equal types', () => {
            const type1 = ScenarioTypeValue.create('required_fields');
            const type2 = ScenarioTypeValue.create('required_fields');
            expect(type1.equals(type2)).toBe(true);
        });

        it('should return false for different types', () => {
            const type1 = ScenarioTypeValue.create('required_fields');
            const type2 = ScenarioTypeValue.create('validation_error');
            expect(type1.equals(type2)).toBe(false);
        });
    });

    describe('Type Properties', () => {
        it('should return string representation', () => {
            const type = ScenarioTypeValue.create('required_fields');
            expect(type.toString()).toBe('required_fields');
        });

        it('should return display name', () => {
            const type = ScenarioTypeValue.create('required_fields');
            expect(type.getDisplayName()).toBe('Required Fields');
        });
    });
});
