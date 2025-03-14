/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColorFx } from "./ColorFx";

export const LogLevelValue = {
    verbose: 10,
    debug: 50,
    chapter: 250,
    title: 250,
    header: 250,
    section: 250,
    note: 250,
    log: 250,
    info: 250,
    warn: 300,
    error: 400,
    fatal: 900,
    all: 1000,
};

export type LogLevel = keyof typeof LogLevelValue;

export const defaultLogLevel = "chapter" as LogLevel;

const DATE_FORMAT = new Intl.DateTimeFormat("en-UK", {
    dateStyle: "short",
    timeStyle: "long",
});

export class CliLoggerOptions {

    level? = defaultLogLevel;

    /**
     * If enabled, will print timestamp (time difference) between current and previous log message.
     */
    timestamp?: boolean = false;

    dateTimeFormat? = "{day}-{month}-{year} {hour}:{minute}:{second}";

    constructor(options: Partial<CliLoggerOptions> = {}) {
        Object.assign(this, options);
    }
}

export class CliLogger {

    readonly name: string = "";
    readonly options: CliLoggerOptions;

    constructor(arg1?: string | CliLoggerOptions, arg2?: CliLoggerOptions) {
        if (arguments.length === 2) {
            this.name = arg1 as string;
            this.options = new CliLoggerOptions(arg2);
        }
        else if (arguments.length === 1) {
            if (typeof arg1 === "string") {
                this.name = arg1;
                this.options = new CliLoggerOptions();
            }
            else {
                this.options = new CliLoggerOptions(arg1);
            }
        }
        else {
            this.options = new CliLoggerOptions();
        }
    }

    getTimestamp() {
        const parts = DATE_FORMAT.formatToParts(Date.now());
        const result = this.options.dateTimeFormat.replace(
            /{(.*?)}/g, (_, p1) => {
                return parts.find(x => x.type === p1)?.value?.padStart(2, "0") ?? _;
            }
        );

        return result;
    }

    log(...messages: unknown[]) {
        this.logAtLevel("log", ...messages);
    }

    info(...messages: unknown[]) {
        this.logAtLevel("info", ...messages);
    }

    warn(...messages: unknown[]) {
        this.logAtLevel("warn", ...messages);
    }

    debug(...messages: unknown[]) {
        this.logAtLevel("debug", ...messages);
    }

    error(...messages: unknown[]) {
        // 1: error
        // 2: message, error
        let stackTrace: string | undefined;
        let errorText: string = messages[0] as string;
        if (messages[0] instanceof Error) {
            stackTrace = messages[0].stack;
            errorText = messages[0].message;
        }
        else if (messages[1] instanceof Error) {
            stackTrace = messages[1].stack;
            errorText = `${errorText}, ${messages[1].message}`;
        }

        this.logAtLevel("error", errorText);
        if (stackTrace) {
            process.stderr.write(`${stackTrace}\n`);
        }
    }

    verbose(...messages: unknown[]) {
        this.logAtLevel("verbose", ...messages);
    }

    fatal(...messages: unknown[]) {
        this.logAtLevel("fatal", ...messages);
    }

    chapter(...messages: unknown[]) {
        this.logAtLevel("chapter", ...messages);
    }

    title(...messages: unknown[]) {
        this.logAtLevel("title", ...messages);
    }

    note(...messages: unknown[]) {
        this.logAtLevel("note", ...messages);
    }

    section(...messages: unknown[]) {
        this.logAtLevel("section", ...messages);
    }

    header(...messages: unknown[]) {
        this.logAtLevel("header", ...messages);
    }

    logAtLevel(level: LogLevel, ...messages: unknown[]) {
        if (LogLevelValue[level] < LogLevelValue[this.options.level]) {
            return;
        }

        this.printMessage(level, ...messages);
    }

    protected printMessage(
        level: LogLevel = defaultLogLevel,
        ...messages: unknown[]
    ) {
        if (!LogLevelValue[level]) {
            throw new Error(`Invalid log level: ${level}`);
        }

        const writeStreamType = level === "error" ? "stderr" : "stdout";
        const formattedLogLevel = level.toUpperCase().padStart(7, " ");

        const messageText = messages.map(x => this.stringifyMessage(x)).join(" ");

        const contextMessage = this.formatContext(this.name);
        const formattedMessage = this.formatMessage(
            level,
            messageText,
            formattedLogLevel,
            contextMessage,
        );

        process[writeStreamType].write(formattedMessage);
    }

    protected colorize(message: string, logLevel: LogLevel) {
        const color = CliLogger.getColorByLevel(logLevel);
        return color(message);
    }

    protected formatContext(context: string): string {
        return context ? ColorFx.yellow(`[${context}] `) : "";
    }

    protected formatMessage(
        level: LogLevel,
        message: unknown,
        formattedLogLevel: string,
        contextMessage: string,
    ) {
        const maxLevelNonMessage = LogLevelValue[level] < LogLevelValue.debug ? "log" : level;
        const output = this.colorize(this.stringifyMessage(message), level);
        formattedLogLevel = this.colorize(formattedLogLevel, maxLevelNonMessage);
        return `${this.getTimestamp()} ${formattedLogLevel} ${contextMessage}${output}\n`;
    }

    protected stringifyMessage(message: unknown): string {
        const valueToStringify = typeof message === "function" ? message() : message;
        if (isPlainObject(valueToStringify) || Array.isArray(valueToStringify)) {
            return `${JSON.stringify(valueToStringify, (key: string, value: any): any =>
                typeof value === "bigint" ? value.toString() : value, 2)}`;
        }

        return String(valueToStringify);
    }

    static getColorByLevel(level: LogLevel) {
        switch (level) {
            case "debug": return ColorFx.magentaBright;
            case "warn": return ColorFx.yellow;
            case "error": return ColorFx.red;
            case "fatal": return ColorFx.bgRedWhite;
            case "verbose": return ColorFx.cyanBright;
            case "chapter": return ColorFx.bgMagentaBlack;
            case "title": return ColorFx.bgCyanBlack;
            case "header": return ColorFx.bgBlueBlack;
            case "section": return ColorFx.bgGreenBlack;
            case "note": return ColorFx.bgYellowBlack;
            case "info": return ColorFx.green;
            case "log": return ColorFx.gray;
            default: return ColorFx.white;
        }
    }
}

const isUndefined = (obj: any): obj is undefined => typeof obj === "undefined";
const isNil = (val: any): val is null | undefined => isUndefined(val) || val === null;
const isObject = (fn: any): fn is object => !isNil(fn) && typeof fn === "object";
const isPlainObject = (fn: any): fn is object => {
    if (!isObject(fn)) {
        return false;
    }
    const proto = Object.getPrototypeOf(fn);
    if (proto === null) {
        return true;
    }
    const ctor =
        Object.prototype.hasOwnProperty.call(proto, "constructor") &&
        proto.constructor;
    return (
        typeof ctor === "function" &&
        ctor instanceof ctor &&
        Function.prototype.toString.call(ctor) ===
        Function.prototype.toString.call(Object)
    );
};
