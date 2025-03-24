import { CliLogger } from "./CliLogger";
import { Spinner, SpinnerOptions } from "./Spinner";

export class Operation {

    readonly spinner;
    readonly errors: string[] = [];
    readonly warnings: string[] = [];

    private _count = 0;
    private _length = 0;

    constructor(readonly name: string, readonly logger: CliLogger = new CliLogger(Operation.name), options?: Partial<SpinnerOptions>) {
        this.spinner = new Spinner(options);
    }

    get count() {
        return this._count;
    }

    get length() {
        return this._length;
    }

    async start(length = 0) {
        this._length = length;
        await this.spinner.start();
    }

    stop() {
        this.spinner.stop();
    }

    step(message: string) {
        if (this._length > 0) {
            this._count += 1;
            message = `${this._count}/${this._length} ${message}`;
        }

        this.log(message);
    }

    finish(message: string = "Done.", errored = false) {
        this.spinner.stopAndClear();
        if (this.errors.length > 0) {
            message = `${message} (${this.errors.length} errors)`;
        }
        else if (this.warnings.length > 0) {
            message = `${message} (${this.warnings.length} warnings)`;
        }
        if (errored || this.errors.length > 0) {
            this.spinner.fail(message);
        }
        else if (this.warnings.length > 0) {
            this.spinner.mixed(message);
        }
        else {
            this.spinner.succeed(message);
        }
    }

    log(message: string) {
        this.spinner.text = message;
    }

    async error(message: string) {
        this.errors.push(message);
        this.spinner.stopAndClear();
        this.logger.error(message);
        await this.spinner.start();
    }

    async warn(message: string) {
        this.warnings.push(message);
        this.spinner.stopAndClear();
        this.logger.warn(message);
        await this.spinner.start();
    }
}
