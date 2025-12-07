import { CircularReferenceError } from '../../../src/domain/errors/CircularReferenceError';

describe('CircularReferenceError Coverage', () => {
    it('should create an instance and serialize to JSON', () => {
        const error = new CircularReferenceError(
            'Circular reference detected',
            ['#/components/schemas/A', '#/components/schemas/B'],
            '#/components/schemas/A'
        );

        expect(error).toBeInstanceOf(CircularReferenceError);
        expect(error.message).toBe('Circular reference detected');
        expect(error.code).toBe('CIRCULAR_REFERENCE');
        expect(error.referencePath).toEqual(['#/components/schemas/A', '#/components/schemas/B']);
        expect(error.circularRef).toBe('#/components/schemas/A');

        const json = error.toJSON();
        expect(json).toEqual(expect.objectContaining({
            name: 'CircularReferenceError',
            code: 'CIRCULAR_REFERENCE',
            message: 'Circular reference detected',
            referencePath: ['#/components/schemas/A', '#/components/schemas/B'],
            circularRef: '#/components/schemas/A'
        }));
        expect(json).toHaveProperty('stack');
    });
});
