import 'reflect-metadata';
import { TestScenario } from '../../../src/domain/entities/TestScenario';
import { ScenarioType } from '../../../src/domain/value-objects/ScenarioType';

describe('TestScenario', () => {
    describe('createScenario', () => {
        it('should create a regular scenario', () => {
            const steps = [
                { keyword: 'Given' as const, text: 'a precondition' },
                { keyword: 'When' as const, text: 'an action occurs' },
                { keyword: 'Then' as const, text: 'an outcome' }
            ];

            const scenario = TestScenario.createScenario(
                'Test scenario',
                ScenarioType.REQUIRED_FIELDS,
                steps,
                ['@tag1', '@tag2']
            );

            expect(scenario.getName()).toBe('Test scenario');
            expect(scenario.getType()).toBe(ScenarioType.REQUIRED_FIELDS);
            expect(scenario.getScenarioType()).toBe('Scenario');
            expect(scenario.getSteps()).toEqual(steps);
            expect(scenario.getTags()).toEqual(['@tag1', '@tag2']);
            expect(scenario.isScenarioOutline()).toBe(false);
        });

        it('should create scenario with description', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                [],
                [],
                'A description'
            );

            expect(scenario.getDescription()).toBe('A description');
        });

        it('should create scenario without description', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                []
            );

            expect(scenario.getDescription()).toBeUndefined();
        });

        it('should create scenario without tags', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                []
            );

            expect(scenario.getTags()).toEqual([]);
        });
    });

    describe('createScenarioOutline', () => {
        it('should create a scenario outline', () => {
            const steps = [
                { keyword: 'Given' as const, text: 'value is <value>' },
                { keyword: 'When' as const, text: 'action occurs' },
                { keyword: 'Then' as const, text: 'result is <result>' }
            ];

            const examples = {
                headers: ['value', 'result'],
                rows: [
                    ['1', 'one'],
                    ['2', 'two']
                ]
            };

            const scenario = TestScenario.createScenarioOutline(
                'Test outline',
                ScenarioType.EDGE_CASE,
                steps,
                examples,
                ['@outline']
            );

            expect(scenario.getName()).toBe('Test outline');
            expect(scenario.getType()).toBe(ScenarioType.EDGE_CASE);
            expect(scenario.getScenarioType()).toBe('Scenario Outline');
            expect(scenario.isScenarioOutline()).toBe(true);
            expect(scenario.getExamples()).toEqual(examples);
            expect(scenario.getExampleCount()).toBe(2);
        });

        it('should create scenario outline with description', () => {
            const examples = {
                headers: ['value'],
                rows: [['1']]
            };

            const scenario = TestScenario.createScenarioOutline(
                'Test',
                ScenarioType.EDGE_CASE,
                [],
                examples,
                [],
                'Outline description'
            );

            expect(scenario.getDescription()).toBe('Outline description');
        });
    });

    describe('getters', () => {
        it('should return immutable copies of steps', () => {
            const steps = [
                { keyword: 'Given' as const, text: 'step 1' }
            ];

            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, steps);

            const retrievedSteps = scenario.getSteps();
            retrievedSteps.push({ keyword: 'Then' as const, text: 'step 2' });

            expect(scenario.getSteps()).toHaveLength(1);
        });

        it('should return immutable copies of tags', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                [],
                ['@tag1']
            );

            const retrievedTags = scenario.getTags();
            retrievedTags.push('@tag2');

            expect(scenario.getTags()).toHaveLength(1);
        });

        it('should return undefined examples for regular scenario', () => {
            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, []);

            expect(scenario.getExamples()).toBeUndefined();
        });
    });

    describe('getStepCount', () => {
        it('should return correct step count', () => {
            const steps = [
                { keyword: 'Given' as const, text: '1' },
                { keyword: 'When' as const, text: '2' },
                { keyword: 'Then' as const, text: '3' }
            ];

            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, steps);

            expect(scenario.getStepCount()).toBe(3);
        });

        it('should return 0 for scenario with no steps', () => {
            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, []);

            expect(scenario.getStepCount()).toBe(0);
        });
    });

    describe('getExampleCount', () => {
        it('should return 0 for regular scenario', () => {
            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, []);

            expect(scenario.getExampleCount()).toBe(0);
        });

        it('should return correct example count for scenario outline', () => {
            const examples = {
                headers: ['value'],
                rows: [['1'], ['2'], ['3']]
            };

            const scenario = TestScenario.createScenarioOutline(
                'Test',
                ScenarioType.EDGE_CASE,
                [],
                examples
            );

            expect(scenario.getExampleCount()).toBe(3);
        });
    });

    describe('hasTag', () => {
        it('should return true for existing tag', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                [],
                ['@smoke', '@regression']
            );

            expect(scenario.hasTag('@smoke')).toBe(true);
            expect(scenario.hasTag('@regression')).toBe(true);
        });

        it('should return false for non-existing tag', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                [],
                ['@smoke']
            );

            expect(scenario.hasTag('@regression')).toBe(false);
        });
    });

    describe('addTag', () => {
        it('should add new tag', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                [],
                ['@smoke']
            );

            const newScenario = scenario.addTag('@regression');

            expect(newScenario.hasTag('@regression')).toBe(true);
            expect(newScenario.getTags()).toContain('@smoke');
            expect(newScenario.getTags()).toContain('@regression');
        });

        it('should not duplicate existing tag', () => {
            const scenario = TestScenario.createScenario(
                'Test',
                ScenarioType.ALL_FIELDS,
                [],
                ['@smoke']
            );

            const sameScenario = scenario.addTag('@smoke');

            expect(sameScenario).toBe(scenario);
            expect(sameScenario.getTags()).toEqual(['@smoke']);
        });
    });

    describe('steps with additional properties', () => {
        it('should handle steps with docString', () => {
            const steps = [
                {
                    keyword: 'Given' as const,
                    text: 'a request body',
                    docString: '{ "name": "test" }'
                }
            ];

            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, steps);

            expect(scenario.getSteps()[0].docString).toBe('{ "name": "test" }');
        });

        it('should handle steps with dataTable', () => {
            const steps = [
                {
                    keyword: 'Given' as const,
                    text: 'the following data',
                    dataTable: {
                        headers: ['name', 'value'],
                        rows: [['item1', '100'], ['item2', '200']]
                    }
                }
            ];

            const scenario = TestScenario.createScenario('Test', ScenarioType.ALL_FIELDS, steps);

            expect(scenario.getSteps()[0].dataTable).toBeDefined();
            expect(scenario.getSteps()[0].dataTable?.rows).toHaveLength(2);
        });
    });
});
