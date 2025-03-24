import * as readline from "readline";
import { spinners } from "./spinners";
import { ColorFx } from "./ColorFx";

export class SpinnerOptions {
    interval: number = 80;
    name?: keyof typeof spinners;
    color?: string;
    suffix?: string;
    prefix?: string;
    text?: string | (() => string);
    spinnerText?: (text: string) => string;

    constructor(options: Partial<SpinnerOptions> = {}) {
        Object.assign(this, options);
    }
}

export class Spinner {

    timer: NodeJS.Timeout | undefined;
    name: keyof typeof spinners = "dots";
    interval: number;
    textValue: string = "";
    suffix = "...";
    prefix = "";
    color = "white";
    static textLength = 0;
    running: boolean;

    constructor(options: Partial<SpinnerOptions> = {}) {
        this.interval = options.interval;
        this.name = options.name || this.name;
        this.color = options.color || this.color;
        this.suffix = options.suffix || this.suffix;
        this.prefix = options.prefix || this.prefix;
    }

    get text(): string {
        return this.textValue;
    }

    set text(value: string) {
        if (!this.running) {
            this.start(value);
            return;
        }

        this.textValue = value;
    }

    private getSpinnerText(spinner: string): string {
        return `${this.prefix}${spinner} ${this.text}${this.suffix}`;
    }

    private print(text: string) {
        this.clear();
        process.stdout.write(text);

        let lines = text.split("\n").reduce((result, line) => result + Math.ceil(line.length / process.stdout.columns), 0);
        return lines;
    }

    async start(text?: string) {

        if (text !== undefined && text !== null) {
            this.text = text;
        }
        
        if (this.running) {
            return this;
        }

        const cursorPos = await this.getCursorPos();
        const currentLine = cursorPos.rows;

        this.running = true;
        this.clear();
        // hide the cursor
        process.stdout.write("\x1B[?25l");

        const spinnerDef = spinners[this.name];
        const interval = this.interval || spinnerDef.interval;
        const spinnerFrames = spinnerDef.frames;

        let index = 0;
        this.timer = setInterval(() => {

            let spinner = spinnerFrames[index];
            if (spinner == undefined) {
                index = 0;
                spinner = spinnerFrames[index];
            }

            this.print(this.getSpinnerText(spinner));
            readline.cursorTo(process.stdout, 0, currentLine);// - 1);
            index = index >= spinnerFrames.length ? 0 : index + 1;

        }, interval);

        return this;
    }

    clear() {
        process.stdout.clearLine(0);
        process.stdout.clearScreenDown();
        return this;
    }

    stop(clear = false) {
        this.running = false;
        clearInterval(this.timer);

        if (clear) {
            this.clear();
        }
        // show the cursor
        process.stdout.write("\x1B[?25h");
        return this;
    }

    complete() {
        this.stop();
        process.stdout.write("\n");
        return this;
    }

    succeed(text = "") {
        return this.stopAndPersist(ColorFx.green(`✔ ${text || this.text}`));
    }

    fail(text = "") {
        return this.stopAndPersist(ColorFx.red(`✖ ${text || this.text}`));
    }

    mixed(text = "") {
        return this.stopAndPersist(ColorFx.yellow(`* ${text || this.text}`));
    }

    stopAndClear() {
        this.stop();
        this.clear();
        return this;
    }

    stopAndPersist(text: string) {
        this.stop();
        this.print(text);
        process.stdout.write("\n");

        return this;
    }

    private async getCursorPos(): Promise<{ rows: number; cols: number }> {
        return new Promise((resolve) => {
            const termcodes = { cursorGetPosition: '\u001b[6n' };
        
            process.stdin.setEncoding('utf8');
            process.stdin.setRawMode(true);
        
            const readfx = function () {
                const buf = process.stdin.read();
                const str = JSON.stringify(buf); // "\u001b[9;1R"
                const regex = /\[(.*)/g;
                const xy = regex.exec(str)[0].replace(/\[|R"/g, '').split(';');
                const pos = { rows: parseInt(xy[0]), cols: parseInt(xy[1]) };
                process.stdin.setRawMode(false);
                resolve(pos);
            }
        
            process.stdin.once('readable', readfx);
            process.stdout.write(termcodes.cursorGetPosition);
        });
    }
}