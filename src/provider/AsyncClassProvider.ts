import type { ClassType, IProviderSync, TupleToTokens } from '../types.js';

/**
 * Provider that asynchronously loads a class implementation and constructs it
 */
export class AsyncClassProvider<T extends { $onInjectorCreate?: any; }, TDeps extends readonly any[]> implements IProviderSync<T> {

	constructor(
		private readonly _factory: () => Promise<ClassType<T, TDeps> | { default: ClassType<T, TDeps>; }>,
		public readonly dependencyTokens: readonly [...TupleToTokens<TDeps>]
	) {
	}

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
