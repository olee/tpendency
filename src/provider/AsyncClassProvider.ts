import type { ClassType, IProvider, TupleToTokens } from '../types.ts';
import type { ProvidableClass } from './ClassProvider.ts';

/**
 * Provider that asynchronously loads a class implementation and constructs it
 */
export class AsyncClassProvider<T extends ProvidableClass, TDeps extends readonly any[]> implements IProvider<T> {

	private readonly _factory: () => Promise<ClassType<T, TDeps> | { default: ClassType<T, TDeps>; }>;
	private readonly dependencyTokens: readonly [...TupleToTokens<TDeps>];

	constructor(
		_factory: () => Promise<ClassType<T, TDeps> | { default: ClassType<T, TDeps>; }>,
		_dependencyTokens: readonly [...TupleToTokens<TDeps>]
	) {
		this._factory = _factory;
		this.dependencyTokens = _dependencyTokens;
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
