import type { IProviderSync, TupleToTokens } from '../types.js';

/**
 * Provider that gets a Promise for values by invoking a factory function.
 */
export class AsyncFactoryProvider<T, TDeps extends readonly any[]> implements IProviderSync<T> {

    public dependencyTokens: readonly [...TupleToTokens<TDeps>];

    private _factory: (...deps: TDeps) => PromiseLike<T>;

    constructor(factory: (...deps: TDeps) => PromiseLike<T>, dependencyTokens: readonly [...TupleToTokens<TDeps>]) {
        this.dependencyTokens = dependencyTokens;
        this._factory = factory;
    }

    public get(dependencies: TDeps): Promise<T> {
        return Promise.resolve(this._factory(...dependencies));
    }
}
