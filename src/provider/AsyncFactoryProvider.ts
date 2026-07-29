import type { IProvider, TupleToTokens } from '../types.ts';

/**
 * Provider that gets a Promise for values by invoking a factory function.
 */
export class AsyncFactoryProvider<T, TDeps extends readonly any[]> implements IProvider<T> {

    private readonly _factory: (...deps: TDeps) => PromiseLike<T>;
    private readonly _dependencyTokens: readonly [...TupleToTokens<TDeps>];

    constructor(
        _factory: (...deps: TDeps) => PromiseLike<T>,
        _dependencyTokens: readonly [...TupleToTokens<TDeps>]
    ) {
        this._factory = _factory;
        this._dependencyTokens = _dependencyTokens;
    }

    public getDependencyTokens() { return this._dependencyTokens; }

    public get(dependencies: TDeps): Promise<T> {
        return Promise.resolve(this._factory(...dependencies));
    }
}
