
export interface ILogger {
    log(...args: any[]): void;
}

export class Logger implements ILogger {
    constructor(
        public readonly prefix: string,
    ) { }

    public log(...args: any[]) {
        console.log(this.prefix, ...args);
    }
}
