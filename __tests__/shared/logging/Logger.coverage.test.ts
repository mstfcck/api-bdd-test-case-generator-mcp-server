import { Logger } from '../../../src/shared/logging/Logger';

describe('Logger Coverage', () => {
    let logger: Logger;
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        logger = new Logger({ level: 'trace' });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should log trace', () => {
        logger.trace('trace message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        expect(log.level).toBe('trace');
        expect(log.message).toBe('trace message');
    });

    it('should log debug', () => {
        logger.debug('debug message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        expect(log.level).toBe('debug');
        expect(log.message).toBe('debug message');
    });

    it('should log info', () => {
        logger.info('info message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        expect(log.level).toBe('info');
        expect(log.message).toBe('info message');
    });

    it('should log warn', () => {
        logger.warn('warn message');
        expect(consoleWarnSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
        expect(log.level).toBe('warn');
        expect(log.message).toBe('warn message');
    });

    it('should log error with object', () => {
        logger.error('error message', { code: 500 });
        expect(consoleErrorSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(log.level).toBe('error');
        expect(log.message).toBe('error message');
        expect(log.code).toBe(500);
    });

    it('should log error with Error object', () => {
        const error = new Error('test error');
        logger.error('error message', error);
        expect(consoleErrorSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(log.level).toBe('error');
        expect(log.message).toBe('error message');
        expect(log.err.message).toBe('test error');
    });

    it('should log fatal with object', () => {
        logger.fatal('fatal message', { code: 500 });
        expect(consoleErrorSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(log.level).toBe('fatal');
        expect(log.message).toBe('fatal message');
        expect(log.code).toBe(500);
    });

    it('should log fatal with Error object', () => {
        const error = new Error('fatal error');
        logger.fatal('fatal message', error);
        expect(consoleErrorSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(log.level).toBe('fatal');
        expect(log.message).toBe('fatal message');
        expect(log.err.message).toBe('fatal error');
    });

    it('should not log if level is too low', () => {
        logger = new Logger({ level: 'error' });
        logger.info('info message');
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should create child logger', () => {
        // The child method implementation in Logger.ts seems to try to parse this.name as JSON
        // but default name is 'api-bdd-generator' which is not JSON.
        // Let's see how it behaves.
        // childLogger.name = JSON.stringify({ ...JSON.parse(this.name), ...bindings });

        // If the name is not JSON, JSON.parse will throw.
        // Let's check the implementation again.
        /*
        child(bindings: object): Logger {
            const childLogger = new Logger({ level: this.level, name: this.name });
            childLogger.name = JSON.stringify({ ...JSON.parse(this.name), ...bindings });
            return childLogger;
        }
        */
        // This looks like a bug in Logger.ts if name is not a JSON string.
        // But let's try to test it assuming name IS a JSON string or see if it fails.

        // If I initialize logger with a JSON name:
        const jsonLogger = new Logger({ level: 'info', name: '{"service":"test"}' });
        const child = jsonLogger.child({ component: 'child' });

        // Access private property for testing? No, let's just log and check output.
        child.info('child message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        const nameObj = JSON.parse(log.name);
        expect(nameObj.service).toBe('test');
        expect(nameObj.component).toBe('child');
    });

    it('should use default config', () => {
        const defaultLogger = new Logger();
        // We can't easily check private properties, but we can check behavior
        // Default level is info.
        defaultLogger.info('default info');
        expect(consoleLogSpy).toHaveBeenCalled();

        defaultLogger.debug('default debug'); // Should not log
        // consoleLogSpy was called once for info.
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should create child logger from plain string name', () => {
        const plainLogger = new Logger({ name: 'plain-name' });
        const child = plainLogger.child({ extra: 'data' });

        child.info('child message');
        expect(consoleLogSpy).toHaveBeenCalled();
        const log = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        // The name should be a JSON string containing { name: 'plain-name', extra: 'data' }
        const nameObj = JSON.parse(log.name);
        expect(nameObj.name).toBe('plain-name');
        expect(nameObj.extra).toBe('data');
    });
});
