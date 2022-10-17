import type { ClassType, IProvider, TupleToTokens } from '../types.js';
import { ProvidableClass } from './ClassProvider.js';

/**
 * Provider that asynchronously loads a class implementation and constructs it
 */
export class AsyncClassProvider<T extends ProvidableClass, TDeps extends readonly any[]> implements IProvider<T> {

	constructor(
		private readonly _factory: () => Promise<ClassType<T, TDeps> | { default: ClassType<T, TDeps>; }>,
		private readonly dependencyTokens: readonly [...TupleToTokens<TDeps>]
	) {
	}

	public getDependencyTokens() { return this.dependencyTokens; }

	public get(dependencies: TDeps): Promise<T> {
		return this._factory().then(async (_module: any) => {
			const Clazz: ClassType<T, TDeps> = _module.default || _module;
			const instance = new Clazz(...dependencies);
			if (typeof instance.$onInjectorCreate === 'function') {
				await instance.$onInjectorCreate();
			}
			return instance;
		});
	}

}
