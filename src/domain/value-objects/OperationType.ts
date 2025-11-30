export enum OperationType {
    LOAD_SPEC = 'load_spec',
    LIST_ENDPOINTS = 'list_endpoints',
    ANALYZE_ENDPOINT = 'analyze_endpoint',
    GENERATE_SCENARIOS = 'generate_scenarios',
    EXPORT_FEATURE = 'export_feature',
    CLEAR_STATE = 'clear_state',
    GET_STATUS = 'get_status'
}

export class OperationTypeValue {
    private constructor(private readonly value: OperationType) { }

    static create(operation: string): OperationTypeValue {
        const enumValue = Object.values(OperationType).find(v => v === operation);
        if (!enumValue) {
            throw new Error(`Invalid operation type: ${operation}`);
        }
        return new OperationTypeValue(enumValue);
    }

    static fromEnum(type: OperationType): OperationTypeValue {
        return new OperationTypeValue(type);
    }

    getValue(): OperationType {
        return this.value;
    }

    equals(other: OperationTypeValue): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    requiresSpecification(): boolean {
        return [
            OperationType.LIST_ENDPOINTS,
            OperationType.ANALYZE_ENDPOINT,
            OperationType.GENERATE_SCENARIOS
        ].includes(this.value);
    }

    requiresEndpointContext(): boolean {
        return [
            OperationType.GENERATE_SCENARIOS,
            OperationType.EXPORT_FEATURE
        ].includes(this.value);
    }
}
