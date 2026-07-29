
export interface ILogger {
    log(...args: any[]): void;
}

export class Logger implements ILogger {

    public readonly prefix: string;

    // Uncomment to test error handling for invalid $onInjectorCreate function
    // public $onInjectorCreate() {
    //     return 1;
    // }

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    public log(...args: any[]) {
        console.log(this.prefix, ...args);
    }
}
