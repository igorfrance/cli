/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColorFx } from "./ColorFx";

export const LogLevelValue = {
    all: 0,
    verbose: 0,
    debug: 10,
    log: 50,
    info: 50,
    chapter: 50,
    title: 50,
    header: 50,
    section: 50,
    note: 50,
    warn: 80,
    error: 95,
    fatal: 100,
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

    messageFormat? = "{timestamp} {level} {context} {message}";

    constructor(options: Partial<CliLoggerOptions> = {}) {
        Object.assign(this, options);
    }
}

export class CliLogger {

    readonly name: string = "";
    readonly options: CliLoggerOptions;

    private messageFormatters = {
        timestamp: this.getTimestamp.bind(this),
        level: this.formatLogLevel.bind(this),
        context: this.formatContext.bind(this),
        message: this.prepareMessageText.bind(this)
    }

    private _messageFormat = ["timestamp", "level", "context", "message"];

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

        if (this.options.messageFormat) {
            this.messageFormat = this.options.messageFormat;
        }

    }

    get messageFormat() {
        return this.options.messageFormat;
    }

    set messageFormat(value: string) {
        this.options.messageFormat = value;
        this._messageFormat = (value.match(/\{.*?\}/g) || [0]).slice(1).map((name) => {
            name = name.replace(/\{(.*?)\}/, "$1");
            const fn = this.messageFormatters[name];
            if (!fn) {
                throw new Error(`Invalid message format: ${name}`);
            }
            return name;
        });
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

        const streamName = this.getLogStream(level);
        const formattedLogLevel = this.formatLogLevel(level);
        const messageText = this.prepareMessageText(...messages);

        const formattedContext = this.formatContext(this.name);
        const formattedMessage = this.formatMessage(
            level,
            messageText,
            formattedLogLevel,
            formattedContext,
        );

        this.printToStream(process[streamName], formattedMessage);
    }

    protected prepareMessageText(...messages: unknown[]) {
        return messages.map(x => this.stringifyMessage(x)).join(" ");
    }
  
    protected printToStream(stream: NodeJS.WriteStream, message: string) {
        stream.clearLine(0);
        stream.write(message.trim() + "\n");
    }
    
    protected getLogStream(level: LogLevel): "stderr" | "stdout" {
        return ["error", "fatal"].includes(level) ? "stderr" : "stdout";
    }

    protected formatLogLevel(level: LogLevel): string {
        level = LogLevelValue[level] === LogLevelValue.info ? "info" : level;
        const logLevel = level.toUpperCase();
        return logLevel.padStart(7, " ");
    }

    colorize(message: string, logLevel: LogLevel) {
        const color = CliLogger.getColorByLevel(logLevel);
        return color(message);
    }

    protected formatContext(context: string): string {
        return context ? ColorFx.yellow(` [${context}]`) : "";
    }

    protected formatMessage(
        level: LogLevel,
        message: string,
        formattedLogLevel: string,
        context: string,
    ) {
        const colorizedMessage = this.colorize(message, level);
        const maxLevel = LogLevelValue[level] === LogLevelValue.info ? "info" : level;
        const colorizedLogLevel = this.colorize(formattedLogLevel, maxLevel);
        return this.prepareOutputMessage({ 
            timestamp: this.getTimestamp(), 
            level: colorizedLogLevel, 
            context, message: 
            colorizedMessage
        });
    }

    protected prepareOutputMessage(args: { timestamp: string, level: string, context: string, message: string }) {
        return this._messageFormat.map(name => args[name]).join(" ")
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
