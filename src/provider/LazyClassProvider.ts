import type { ClassType, IProvider, TupleToTokens, InjectedTokens } from '../types.js';
import { ClassDependencyTokensSymbol } from '../types.js';

export type LazyClassProviderFactory<CLS extends ClassType<any, TDeps>, TDeps extends readonly any[]> =
	() => Promise<CLS & InjectedTokens<TDeps>>;

/**
 * Provider that gets values by constructing an instance of a class.
 */
export class LazyClassProvider<T, TDeps extends readonly any[], CLS extends ClassType<T, TDeps>> implements IProvider<T, TDeps> {

	private _factoryResult?: Promise<CLS & InjectedTokens<TDeps>>;

	constructor(
		private readonly _factory: LazyClassProviderFactory<CLS, TDeps>
	) {
	}

	private get factoryResult() {
		if (!this._factoryResult) {
			this._factoryResult = this._factory();
		}
		return this._factoryResult;
	}

	public get(dependencies: TDeps): Promise<T> {
		return this.factoryResult.then(clazz => {
			return new clazz(...dependencies);
		});
	}

	public getDependencyTokens(): Promise<TupleToTokens<TDeps>> {
		return this.factoryResult.then((clazz) => {
			if (clazz.length > 0 && !clazz[ClassDependencyTokensSymbol]) {
				throw new Error(`Trying to resolve class without providing dependencies explicitly or by decorators`);
			}
			return clazz[ClassDependencyTokensSymbol];
		});
	}

}
