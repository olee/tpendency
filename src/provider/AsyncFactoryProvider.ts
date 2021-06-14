import type { IProvider, TupleToTokens } from '../types.js';

/**
 * Provider that gets a Promise for values by invoking a factory function.
 */
export class AsyncFactoryProvider<T, TDeps extends readonly any[]> implements IProvider<T> {

    constructor(
        private _factory: (...deps: TDeps) => PromiseLike<T>,
        private _dependencyTokens: readonly [...TupleToTokens<TDeps>]
    ) { }

    public getDependencyTokens() { return this._dependencyTokens; }

    public get(dependencies: TDeps): Promise<T> {
        return Promise.resolve(this._factory(...dependencies));
    }
}
