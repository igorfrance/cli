import * as readline from "readline";
import { spinners } from "./spinners";
import { ColorFx } from "./ColorFx";

class SpinnerOptions {
    interval: number;
    name?: keyof typeof spinners;
    color?: string;
    suffix?: string;
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
    color = "white";
    static textLength = 0;
    running: boolean;

    constructor(options: SpinnerOptions = new SpinnerOptions()) {
        this.interval = options.interval;
        this.name = options.name || this.name;
        this.color = options.color || this.color;
        this.suffix = options.suffix || this.suffix;
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
        return `${spinner} ${this.text}${this.suffix}`;
    }

    private print(text: string) {
        const diff = process.stdout.columns - text.length;
        text += " ".repeat(diff);
        process.stdout.write(text);
    }

    start(text?: string) {

        if (this.running) {
            this.text = text || "";
            return this;
        }

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

            readline.cursorTo(process.stdout, 0);
            index = index >= spinnerFrames.length ? 0 : index + 1;

        }, interval);

        return this;
    }

    clear() {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        return this;
    }

    stop(clear = false) {
        if (!this.running) {
            return this;
        }

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
}
