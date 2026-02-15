/**
 * Logger interface - abstracts the logging implementation.
 * Domain and application layers should depend on this interface, not the concrete Logger class.
 */
export interface ILogger {
    trace(message: string, meta?: object): void;
    debug(message: string, meta?: object): void;
    info(message: string, meta?: object): void;
    warn(message: string, meta?: object): void;
    error(message: string, error?: Error | object): void;
    fatal(message: string, error?: Error | object): void;
    child(bindings: object): ILogger;
}
