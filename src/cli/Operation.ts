import { CliLogger } from "./CliLogger";
import { Spinner } from "./Spinner";

export class Operation {

    private readonly spinner = new Spinner();
    private readonly errors: string[] = [];
    private readonly warnings: string[] = [];
    private count = 0;
    private length = 0;

    constructor(readonly name: string, readonly logger: CliLogger = new CliLogger(Operation.name)) {
    }

    async start(length = 0) {
        this.length = length;
        this.logger.info(this.name);
        this.spinner.start();
    }

    step(message: string) {
        if (this.length > 0) {
            this.count += 1;
            message = `${this.count}/${this.length} ${message}`;
        }

        this.log(message);
    }

    finish(message: string = "Done.") {
        if (this.errors.length > 0) {
            message = `${message} (${this.errors.length} errors)`;
        }
        if (this.warnings.length > 0) {
            message = `${message} (${this.warnings.length} warnings)`;
        }
        if (this.errors.length > 0) {
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

    error(message: string) {
        this.errors.push(message);
        this.spinner.stopAndClear();
        this.logger.error(message);
        this.spinner.start();
    }

    warn(message: string) {
        this.warnings.push(message);
        this.spinner.stopAndClear();
        this.logger.warn(message);
        this.spinner.start();
    }
}
