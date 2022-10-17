import type { ClassType, IProvider, TupleToTokens, InjectedTokens } from '../types.js';
import { ClassDependencyTokensSymbol } from '../types.js';

interface ClassWithOnInjectorCreate { $onInjectorCreate(): void | Promise<unknown>; };

export type ProvidableClass = Partial<ClassWithOnInjectorCreate>;

/**
 * Provider that gets values by constructing an instance of a class.
 */
export class ClassProvider<T extends {}, TDeps extends readonly any[], CLS extends ClassType<T & ProvidableClass, TDeps>> implements IProvider<T, TDeps> {

	private readonly _dependencyTokens: TupleToTokens<TDeps>;

	constructor(
		private readonly _class: CLS | CLS & InjectedTokens<TDeps>,
		dependencyTokens: CLS extends InjectedTokens<TDeps> ? undefined : TupleToTokens<TDeps>
	) {
		if (!_class) {
			throw new Error(`ClassProvider created with undefined class. Perhaps you have an import order issue`);
		}
		if (dependencyTokens) {
			this._dependencyTokens = dependencyTokens;
		} else if (_class.length > 0 && !(_class as InjectedTokens<TDeps>)[ClassDependencyTokensSymbol]) {
			throw new Error(`Class ${_class.name} does not have @Inject but also no dependencies were defined`);
		} else {
			this._dependencyTokens = (_class as InjectedTokens<TDeps>)[ClassDependencyTokensSymbol]!;
		}
	}

	public getDependencyTokens() { return this._dependencyTokens; }

	public async get(dependencies: TDeps): Promise<T> {
		const instance = new this._class(...dependencies);
		if (typeof instance.$onInjectorCreate === 'function') {
			await instance.$onInjectorCreate();
		}
		return instance;
	}

}
