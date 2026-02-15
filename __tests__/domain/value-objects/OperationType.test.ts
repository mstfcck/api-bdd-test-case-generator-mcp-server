import { OperationType } from '../../../src/domain/value-objects/OperationType';

describe('OperationType', () => {
    describe('Enum Values', () => {
        it('should have load_spec value', () => {
            expect(OperationType.LOAD_SPEC).toBe('load_spec');
        });

        it('should have list_endpoints value', () => {
            expect(OperationType.LIST_ENDPOINTS).toBe('list_endpoints');
        });

        it('should have analyze_endpoint value', () => {
            expect(OperationType.ANALYZE_ENDPOINT).toBe('analyze_endpoint');
        });

        it('should have generate_scenarios value', () => {
            expect(OperationType.GENERATE_SCENARIOS).toBe('generate_scenarios');
        });

        it('should have export_feature value', () => {
            expect(OperationType.EXPORT_FEATURE).toBe('export_feature');
        });

        it('should have clear_state value', () => {
            expect(OperationType.CLEAR_STATE).toBe('clear_state');
        });

        it('should have get_status value', () => {
            expect(OperationType.GET_STATUS).toBe('get_status');
        });
    });

    describe('Enum Completeness', () => {
        it('should have exactly 7 operation types', () => {
            const values = Object.values(OperationType);
            expect(values).toHaveLength(7);
        });

        it('should contain all expected values', () => {
            const values = Object.values(OperationType);
            expect(values).toEqual(expect.arrayContaining([
                'load_spec',
                'list_endpoints',
                'analyze_endpoint',
                'generate_scenarios',
                'export_feature',
                'clear_state',
                'get_status'
            ]));
        });
    });
});
