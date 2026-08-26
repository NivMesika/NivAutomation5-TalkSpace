/**
 * Playwright project logger — ANSI-colored console wrapper with level filtering.
 */
export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    HTTP = 'HTTP',
    DEBUG = 'DEBUG',
}

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.HTTP]: 3,
    [LogLevel.DEBUG]: 4,
};

const VALID_LOG_LEVELS = new Set<string>(Object.values(LogLevel));

function defaultLevelFromEnv(): LogLevel {
    const isCI = process.env.NODE_ENV === 'CI' || Boolean(process.env.CI);
    return isCI ? LogLevel.INFO : LogLevel.DEBUG;
}

let currentLevel: LogLevel;

function initializeLevel(): LogLevel {
    const raw = process.env.LOG_LEVEL?.trim();
    if (raw) {
        const normalized = raw.toUpperCase();
        if (VALID_LOG_LEVELS.has(normalized)) {
            return normalized as LogLevel;
        }
        console.warn(
            `Invalid LOG_LEVEL "${raw}"; falling back to default. Valid values: ERROR, WARN, INFO, HTTP, DEBUG`,
        );
    }
    return defaultLevelFromEnv();
}

currentLevel = initializeLevel();

const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

export class Logger {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    private static shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_RANK[level] <= LOG_LEVEL_RANK[currentLevel];
    }

    private getLogLevelStyle(level: LogLevel): { color: string } {
        switch (level) {
            case LogLevel.ERROR:
                return { color: Colors.red };
            case LogLevel.WARN:
                return { color: Colors.yellow };
            case LogLevel.INFO:
                return { color: Colors.cyan };
            case LogLevel.HTTP:
                return { color: Colors.magenta };
            case LogLevel.DEBUG:
                return { color: Colors.gray };
            default:
                return { color: Colors.white };
        }
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        const { color } = this.getLogLevelStyle(level);
        const contextStr = this.context ? `${Colors.dim}[${this.context}]${Colors.reset}` : '';
        const levelStr = `${color}${Colors.bright}${level.padEnd(5)}${Colors.reset}`;
        const timeStr = `${Colors.gray}${timestamp}${Colors.reset}`;

        return `${timeStr} ${levelStr} ${contextStr} ${message}`;
    }

    error(message: string, ...args: unknown[]): void {
        if (!Logger.shouldLog(LogLevel.ERROR)) {
            return;
        }
        console.error(this.formatMessage(LogLevel.ERROR, message));
        if (args.length > 0) {
            console.error(`${Colors.red}${Colors.dim}   ↳ Additional data:${Colors.reset}`, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (!Logger.shouldLog(LogLevel.WARN)) {
            return;
        }
        console.warn(this.formatMessage(LogLevel.WARN, message));
        if (args.length > 0) {
            console.warn(`${Colors.yellow}${Colors.dim}   ↳ Additional data:${Colors.reset}`, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (!Logger.shouldLog(LogLevel.INFO)) {
            return;
        }
        console.info(this.formatMessage(LogLevel.INFO, message));
        if (args.length > 0) {
            console.info(`${Colors.cyan}${Colors.dim}   ↳ Additional data:${Colors.reset}`, ...args);
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (!Logger.shouldLog(LogLevel.DEBUG)) {
            return;
        }
        console.log(this.formatMessage(LogLevel.DEBUG, message));
        if (args.length > 0) {
            console.log(`${Colors.gray}   ↳ Additional data:${Colors.reset}`, ...args);
        }
    }

    success(message: string): void {
        if (!Logger.shouldLog(LogLevel.INFO)) {
            return;
        }
        const timeStr = `${Colors.gray}${new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })}${Colors.reset}`;
        const contextStr = this.context ? `${Colors.dim}[${this.context}]${Colors.reset}` : '';
        const levelStr = `${Colors.green}${Colors.bright}PASS ${Colors.reset}`;

        console.log(`${timeStr} ${levelStr} ${contextStr} ${message}`);
    }
}
