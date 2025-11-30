import { OperationType, OperationTypeValue } from '../../../src/domain/value-objects/OperationType';

describe('OperationType', () => {
    describe('Valid Operation Types', () => {
        it('should create OperationTypeValue with valid type: load_spec', () => {
            const opType = OperationTypeValue.create('load_spec');
            expect(opType.getValue()).toBe(OperationType.LOAD_SPEC);
        });

        it('should create OperationTypeValue with valid type: list_endpoints', () => {
            const opType = OperationTypeValue.create('list_endpoints');
            expect(opType.getValue()).toBe(OperationType.LIST_ENDPOINTS);
        });

        it('should create OperationTypeValue with valid type: analyze_endpoint', () => {
            const opType = OperationTypeValue.create('analyze_endpoint');
            expect(opType.getValue()).toBe(OperationType.ANALYZE_ENDPOINT);
        });

        it('should create OperationTypeValue with valid type: generate_scenarios', () => {
            const opType = OperationTypeValue.create('generate_scenarios');
            expect(opType.getValue()).toBe(OperationType.GENERATE_SCENARIOS);
        });

        it('should create OperationTypeValue with valid type: export_feature', () => {
            const opType = OperationTypeValue.create('export_feature');
            expect(opType.getValue()).toBe(OperationType.EXPORT_FEATURE);
        });

        it('should create OperationTypeValue with valid type: clear_state', () => {
            const opType = OperationTypeValue.create('clear_state');
            expect(opType.getValue()).toBe(OperationType.CLEAR_STATE);
        });

        it('should create OperationTypeValue with valid type: get_status', () => {
            const opType = OperationTypeValue.create('get_status');
            expect(opType.getValue()).toBe(OperationType.GET_STATUS);
        });
    });

    describe('Invalid Operation Types', () => {
        it('should throw Error for invalid type: invalid_operation', () => {
            expect(() => OperationTypeValue.create('invalid_operation'))
                .toThrow('Invalid operation type: invalid_operation');
        });

        it('should throw Error for invalid type: LOAD_SPEC', () => {
            expect(() => OperationTypeValue.create('LOAD_SPEC'))
                .toThrow('Invalid operation type: LOAD_SPEC');
        });

        it('should throw Error for empty string', () => {
            expect(() => OperationTypeValue.create(''))
                .toThrow('Invalid operation type: ');
        });
    });

    describe('Create from Enum', () => {
        it('should create from enum value', () => {
            const opType = OperationTypeValue.fromEnum(OperationType.ANALYZE_ENDPOINT);
            expect(opType.getValue()).toBe(OperationType.ANALYZE_ENDPOINT);
        });
    });

    describe('Equality', () => {
        it('should return true for equal types', () => {
            const type1 = OperationTypeValue.create('load_spec');
            const type2 = OperationTypeValue.create('load_spec');
            expect(type1.equals(type2)).toBe(true);
        });

        it('should return false for different types', () => {
            const type1 = OperationTypeValue.create('load_spec');
            const type2 = OperationTypeValue.create('list_endpoints');
            expect(type1.equals(type2)).toBe(false);
        });
    });

    describe('Type Properties', () => {
        it('should return string representation', () => {
            const opType = OperationTypeValue.create('load_spec');
            expect(opType.toString()).toBe('load_spec');
        });

        describe('requiresSpecification', () => {
            it('should return true for list_endpoints', () => {
                const opType = OperationTypeValue.create('list_endpoints');
                expect(opType.requiresSpecification()).toBe(true);
            });

            it('should return true for analyze_endpoint', () => {
                const opType = OperationTypeValue.create('analyze_endpoint');
                expect(opType.requiresSpecification()).toBe(true);
            });

            it('should return true for generate_scenarios', () => {
                const opType = OperationTypeValue.create('generate_scenarios');
                expect(opType.requiresSpecification()).toBe(true);
            });

            it('should return false for load_spec', () => {
                const opType = OperationTypeValue.create('load_spec');
                expect(opType.requiresSpecification()).toBe(false);
            });

            it('should return false for export_feature', () => {
                const opType = OperationTypeValue.create('export_feature');
                expect(opType.requiresSpecification()).toBe(false);
            });

            it('should return false for clear_state', () => {
                const opType = OperationTypeValue.create('clear_state');
                expect(opType.requiresSpecification()).toBe(false);
            });

            it('should return false for get_status', () => {
                const opType = OperationTypeValue.create('get_status');
                expect(opType.requiresSpecification()).toBe(false);
            });
        });

        describe('requiresEndpointContext', () => {
            it('should return true for generate_scenarios', () => {
                const opType = OperationTypeValue.create('generate_scenarios');
                expect(opType.requiresEndpointContext()).toBe(true);
            });

            it('should return true for export_feature', () => {
                const opType = OperationTypeValue.create('export_feature');
                expect(opType.requiresEndpointContext()).toBe(true);
            });

            it('should return false for load_spec', () => {
                const opType = OperationTypeValue.create('load_spec');
                expect(opType.requiresEndpointContext()).toBe(false);
            });

            it('should return false for list_endpoints', () => {
                const opType = OperationTypeValue.create('list_endpoints');
                expect(opType.requiresEndpointContext()).toBe(false);
            });

            it('should return false for analyze_endpoint', () => {
                const opType = OperationTypeValue.create('analyze_endpoint');
                expect(opType.requiresEndpointContext()).toBe(false);
            });

            it('should return false for clear_state', () => {
                const opType = OperationTypeValue.create('clear_state');
                expect(opType.requiresEndpointContext()).toBe(false);
            });

            it('should return false for get_status', () => {
                const opType = OperationTypeValue.create('get_status');
                expect(opType.requiresEndpointContext()).toBe(false);
            });
        });
    });
});
