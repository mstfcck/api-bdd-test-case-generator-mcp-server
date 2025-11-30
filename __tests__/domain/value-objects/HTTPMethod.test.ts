import 'reflect-metadata';
import { HTTPMethod } from '../../../src/domain/value-objects/HTTPMethod';

describe('HTTPMethod', () => {
    describe('Valid HTTP Methods', () => {
        test.each([
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'HEAD',
            'OPTIONS',
        ])('should create HTTPMethod with valid method: %s', (method) => {
            const httpMethod = HTTPMethod.create(method);
            expect(httpMethod.getValue()).toBe(method);
        });

        it('should normalize lowercase to uppercase', () => {
            const httpMethod = HTTPMethod.create('get');
            expect(httpMethod.getValue()).toBe('GET');
        });
    });

    describe('Invalid HTTP Methods', () => {
        test.each([
            'INVALID',
            'CONNECT',
            'TRACE',
            '',
            ' ',
        ])('should throw Error for invalid method: %s', (method) => {
            expect(() => HTTPMethod.create(method)).toThrow(Error);
            expect(() => HTTPMethod.create(method)).toThrow(`Invalid HTTP method: ${method}`);
        });
    });

    describe('Equality', () => {
        it('should return true for equal methods', () => {
            const method1 = HTTPMethod.create('GET');
            const method2 = HTTPMethod.create('GET');
            expect(method1.equals(method2)).toBe(true);
        });

        it('should return false for different methods', () => {
            const method1 = HTTPMethod.create('GET');
            const method2 = HTTPMethod.create('POST');
            expect(method1.equals(method2)).toBe(false);
        });
    });

    describe('Method Properties', () => {
        it('should identify idempotent methods', () => {
            expect(HTTPMethod.create('GET').isIdempotent()).toBe(true);
            expect(HTTPMethod.create('PUT').isIdempotent()).toBe(true);
            expect(HTTPMethod.create('DELETE').isIdempotent()).toBe(true);
            expect(HTTPMethod.create('POST').isIdempotent()).toBe(false);
        });

        it('should identify safe methods', () => {
            expect(HTTPMethod.create('GET').isSafe()).toBe(true);
            expect(HTTPMethod.create('HEAD').isSafe()).toBe(true);
            expect(HTTPMethod.create('OPTIONS').isSafe()).toBe(true);
            expect(HTTPMethod.create('POST').isSafe()).toBe(false);
            expect(HTTPMethod.create('PUT').isSafe()).toBe(false);
        });

        it('should return string representation', () => {
            const method = HTTPMethod.create('POST');
            expect(method.toString()).toBe('POST');
        });
    });
});
