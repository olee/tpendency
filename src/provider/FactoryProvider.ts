import type { IProvider, TupleToTokens } from '../types.js';

/**
 * Provider that gets values by invoking a factory function.
 */
export class FactoryProvider<T, TDeps extends readonly any[]> implements IProvider<T> {

	constructor(
		private readonly _factory: (...deps: TDeps) => T,
		private readonly _dependencyTokens: readonly [...TupleToTokens<TDeps>]
	) { }

	public getDependencyTokens() { return this._dependencyTokens; }

	public get(dependencies: TDeps): Promise<T> {
		return Promise.resolve(
			this._factory(...dependencies)
		);
	}
}

