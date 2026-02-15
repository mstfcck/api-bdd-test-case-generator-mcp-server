import { ILogger } from './ILogger.js';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
    level?: LogLevel;
    name?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
};

export class Logger implements ILogger {
    private level: LogLevel;
    private name: string;

    constructor(config: LoggerConfig = {}) {
        this.level = config.level || 'info';
        this.name = config.name || 'api-bdd-generator';
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }

    private log(level: LogLevel, message: string, meta?: object): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            name: this.name,
            message,
            ...meta
        };

        const output = JSON.stringify(logEntry);

        switch (level) {
            case 'error':
            case 'fatal':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }

    trace(message: string, meta?: object): void {
        this.log('trace', message, meta);
    }

    debug(message: string, meta?: object): void {
        this.log('debug', message, meta);
    }

    info(message: string, meta?: object): void {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: object): void {
        this.log('warn', message, meta);
    }

    error(message: string, error?: Error | object): void {
        const meta = error instanceof Error ? {
            err: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        } : error;
        this.log('error', message, meta);
    }

    fatal(message: string, error?: Error | object): void {
        const meta = error instanceof Error ? {
            err: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        } : error;
        this.log('fatal', message, meta);
    }

    child(bindings: object): ILogger {
        const childLogger = new Logger({ level: this.level, name: this.name });
        let currentContext = {};
        try {
            currentContext = JSON.parse(this.name);
        } catch (e) {
            currentContext = { name: this.name };
        }
        childLogger.name = JSON.stringify({ ...currentContext, ...bindings });
        return childLogger;
    }
}

