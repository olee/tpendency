import type { ClassType, IProviderSync, TupleToTokens, InjectedTokens } from '../types.js';
import { ClassDependencyTokensSymbol } from '../types.js';

/**
 * Provider that gets values by constructing an instance of a class.
 */
export class ClassProvider<T extends { $onInjectorCreate?: any; }, TDeps extends readonly any[], CLS extends ClassType<T, TDeps>> implements IProviderSync<T, TDeps> {

	public dependencyTokens: TupleToTokens<TDeps>;

	constructor(
		private _class: CLS extends new () => any ? CLS : CLS & InjectedTokens<TDeps>,
		dependencyTokens: CLS extends InjectedTokens<TDeps> ? undefined : TupleToTokens<TDeps>
	) {
		if (!_class) {
			throw new Error(`ClassProvider created with undefined class. Perhaps you have an import order issue`);
		}
		this._class = _class;
		if (dependencyTokens) {
			this.dependencyTokens = dependencyTokens;
		} else if (_class.length > 0 && !(_class as InjectedTokens<TDeps>)[ClassDependencyTokensSymbol]) {
			throw new Error(`Class ${_class.name} does not have @Inject but also no dependencies were defined`);
		} else {
			this.dependencyTokens = (_class as InjectedTokens<TDeps>)[ClassDependencyTokensSymbol]!;
		}
	}

	public async get(dependencies: TDeps): Promise<T> {
		const instance = new this._class(...dependencies);
		if (typeof instance.$onInjectorCreate === 'function') {
			await instance.$onInjectorCreate();
		}
		return instance;
	}

}
