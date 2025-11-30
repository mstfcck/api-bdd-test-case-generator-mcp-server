export enum ScenarioType {
    REQUIRED_FIELDS = 'required_fields',
    ALL_FIELDS = 'all_fields',
    VALIDATION_ERROR = 'validation_error',
    AUTH_ERROR = 'auth_error',
    NOT_FOUND = 'not_found',
    EDGE_CASE = 'edge_case'
}

export class ScenarioTypeValue {
    private constructor(private readonly value: ScenarioType) { }

    static create(type: string): ScenarioTypeValue {
        const enumValue = Object.values(ScenarioType).find(v => v === type);
        if (!enumValue) {
            throw new Error(`Invalid scenario type: ${type}`);
        }
        return new ScenarioTypeValue(enumValue);
    }

    static fromEnum(type: ScenarioType): ScenarioTypeValue {
        return new ScenarioTypeValue(type);
    }

    getValue(): ScenarioType {
        return this.value;
    }

    equals(other: ScenarioTypeValue): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    getDisplayName(): string {
        return this.value.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
}
