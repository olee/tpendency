
export interface ILogger {
    log(...args: any[]): void;
}

export class Logger implements ILogger {
    constructor(
        public readonly prefix: string,
    ) { }

    // Uncomment to test error handling for invalid $onInjectorCreate function
    // public $onInjectorCreate() {
    //     return 1;
    // }

    public log(...args: any[]) {
        console.log(this.prefix, ...args);
    }
}
