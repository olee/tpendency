import type { IToken, IBinding, TupleToTokens, ClassType, IProvider, ClassTypeWithTokens } from './types.js';

import { AsyncClassProvider, AsyncFactoryProvider, ClassProvider, FactoryProvider, LazyClassProvider, LazyClassProviderFactory, ValueProvider } from './provider/index.js';

/**
 * Creates a binding from a token and a provider
 */
export function createBinding<T>(token: IToken<T>, provider: IProvider<T>): IBinding<T> {
	return { token, provider };
}

/**
 * Binds the token to a constant value.
 *
 * @param token Token to bind to
 * @param value Value to bind to the token
 */
export function bindValue<T>(token: IToken<T>, value: T): IBinding<T> {
	return createBinding(token, new ValueProvider(value));
}

/**
 * Binds the token to the value of another token.
 *
 * @param token Token to bind to
 * @param otherToken Other token which value to binds the token to
 */
export function bindToToken<T, TOther extends T>(token: IToken<T>, otherToken: IToken<TOther>) {
	return createBinding(token, new FactoryProvider(res => res, [otherToken]));
}

/**
 * Binds the token to a factory function.
 *
 * @param token Token to bind to
 * @param factory Factory function that returns the value for the token
 * @param dependencyTokens Tokens to inject into the factory function
 *
 * @example
 * bindFactory(TargetToken,
 *     [Dep1Token],
 *     (...deps) => new m.default(...deps)
 * );
 * bindFactory(TargetToken,
 *     [Dep1Token, Dep2Token],
 *     (...deps) => new m.MyClass(...deps)
 * );
 */
export function bindFactory<T, TDeps extends readonly any[]>(
	token: IToken<T>, factory: (...deps: TDeps) => T, dependencyTokens: readonly [...TupleToTokens<TDeps>]
): IBinding<T> {
	return createBinding(token, new FactoryProvider(factory, dependencyTokens));
}

/**
 * Binds the token to an asynchronous factory function.
 *
 * @param token Token to bind to
 * @param factory Factory function that returns the Promise for the value for the token
 * @param dependencyTokens Tokens to inject into the factory function
 * 
 * @example
 * bindAsyncFactory(TargetToken,
 *     [Dep1Token],
 *     (...deps) => import('./someModuleWithDefaultExport').then(m => new m.default(...deps))
 * );
 * bindAsyncFactory(TargetToken,
 *     [Dep1Token, Dep2Token],
 *     (...deps) => import('./someModule').then(m => new m.MyClass(...deps))
 * );
 */
export function bindAsyncFactory<T, TDeps extends readonly any[]>(
	token: IToken<T>, factory: (...deps: TDeps) => Promise<T>, dependencyTokens: readonly [...TupleToTokens<TDeps>]
): IBinding<T> {
	return createBinding(token, new AsyncFactoryProvider(factory, dependencyTokens));
}

/**
 * Binds the token to a class which will be constructed when the dependency is provided.
 * The dependencies of the class will be passed into the constructor automatically.
 *
 * @param token Token to bind to
 * @param Class Class with either no dependencies or which has been decorated with `@Inject`
 *
 * @example
 * bindClass(TargetToken, MyClassWithoutDependencies);
 * bindClass(TargetToken, MyClassWithInjectDecorator);
 */
export function bindClass<T>(token: IToken<T>, Class: ClassType<T, []> | ClassTypeWithTokens<T>): IBinding<T>;

/**
 * Binds the token to a class which will be constructed when the dependency is provided.
 * The dependencies of the class will be passed into the constructor automatically.
 *
 * @param token Token to bind to
 * @param Class Class to construct
 * @param dependencyTokens Tokens to inject into the constructor
 *
 * @example
 * bindClass(TargetToken,
 *     (...deps) => import('./someModuleWithDefaultExport').then(m => new m.default(...deps)),
 *     [Dep1Token]
 * );
 * bindClass(TargetToken,
 *     (...deps) => import('./someModule').then(m => new m.MyClass(...deps)),
 *     [Dep1Token, Dep2Token]
 * );
 */
export function bindClass<T, TDeps extends any[]>(
	token: IToken<T>, clazz: ClassType<T, TDeps>, dependencyTokens: readonly [...TupleToTokens<TDeps>]
): IBinding<T>;

/** */
export function bindClass<T, TDeps extends any[]>(
	token: IToken<T>, clazz: any, dependencyTokens?: readonly [...TupleToTokens<TDeps>]
): IBinding<T> {
	return createBinding(token, new ClassProvider(clazz, dependencyTokens!));
}

/**
 * Binds the token to an asynchronous function which should return a class type.
 * The class is then instantiated in the same way as with `ClassProvider`.
 *
 * @param token Token to bind to
 * @param factory Factory which returns a promise to a class type
 * @param dependencyTokens Tokens to inject into the constructor
 *
 * @example
 * bindAsyncClass(TargetToken,
 *     () => import('./someClassModuleWithDefaultExport'),
 *     [Dep1Token]
 * );
 * bindAsyncClass(TargetToken,
 *     () => import('./someModule').then(m => m.MyClass),
 *     [Dep1Token, Dep2Token]
 * );
 */
export function bindAsyncClass<T, TDeps extends any[], CLS extends new (...deps: TDeps) => T>(
	token: IToken<T>,
	factory: () => Promise<CLS | { default: CLS; }>,
	dependencyTokens: readonly [...TupleToTokens<TDeps>]
): IBinding<T> {
	return createBinding(token, new AsyncClassProvider(factory, dependencyTokens));
}

/**
 * Binds the token to an async factory which constructs a class.
 *
 * @param token Token to bind to
 * @param factory Factory which returns either:
 * - Class with no dependencies
 * - Class which has been decorated with static dependency tokens
 * 
 * @example
 * bindAsyncClass(TargetToken, () => import('./someModule').then(m => m.MyClassWithStaticDeps));
 * 
 * // requires class decorated like this:
 * class _MyClassWithStaticDeps {
 *     static [ClassDependencyTokensSymbol] = [Dep1Token, Dep2Token] as const;
 *     constructor(public dep1: Dep1, public dep2: Dep2) { }
 * }
 */
export function bindLazyClass<T, TDeps extends readonly any[], CLS extends ClassType<T, TDeps>>(token: IToken<T>, factory: LazyClassProviderFactory<CLS, TDeps>): IBinding<T> {
	return createBinding(token, new LazyClassProvider(factory));
}

/**
 * An unprovided binding is a binding that has a token but no provider.
 */
class UnprovidedBinding<T> {

	/**
	 * @param token Token to bind to
	 */
	constructor(private readonly token: IToken<T>) {
	}

	/**
	 * Binds the token to a value.
	 * 
	 * @param value Value to bind to the token
	 */
	public toValue(value: T): IBinding<T> {
		return createBinding(this.token, new ValueProvider(value));
	}

	// /**
	//  * Binds the token to the value of another token.
	//  * 
	//  * @param token Other token to bind to the token to
	//  */
	public toToken<TOther extends T>(token: IToken<TOther>) {
		return createBinding(this.token, new FactoryProvider(res => res, [token]));
	}
	// bindToToken<T, TOther extends T>(token: IToken<T>, otherToken: IToken<TOther>) {
	// 	return createBinding(token, new FactoryProvider(res => res, [otherToken]));
	// }

	/**
	 * Binds the token to a factory.
	 * 
	 * @param factory Factory function that returns the value for the token
	 * @param [dependencyTokens] Tokens to inject into the factory function
	 */
	public toFactory<TDeps extends any[]>(factory: (...deps: TDeps) => T, dependencyTokens: readonly [...TupleToTokens<TDeps>]): IBinding<T> {
		return createBinding(this.token, new FactoryProvider(factory, dependencyTokens));
	}

	/**
	 * Binds the token to an asynchronous factory.
	 * 
	 * @param factory Factory function that returns the Promise for the value for the token
	 * @param dependencyTokens Tokens to inject into the factory function
	 */
	public toAsyncFactory<TDeps extends any[]>(factory: (...deps: TDeps) => Promise<T>, dependencyTokens: readonly [...TupleToTokens<TDeps>]): IBinding<T> {
		return createBinding(this.token, new AsyncFactoryProvider(factory, dependencyTokens));
	}

	/**
	 * Binds the token to a class which will be constructed when providing it
	 *
	 * @param token Token to bind to
	 * @param Class Class with either no dependencies or which has been decorated with `@Inject`
	 */
	public toClass(Class: ClassType<T, []> | ClassTypeWithTokens<T>): IBinding<T>;

	/**
	 * Binds the token to a class which will be constructed when providing it
	 *
	 * @param Class Class to construct
	 * @param dependencyTokens Tokens to inject into the constructor
	 */
	public toClass<TDeps extends any[]>(Class: ClassType<T, TDeps>, dependencyTokens: readonly [...TupleToTokens<TDeps>]): IBinding<T>;

	public toClass<TDeps extends any[]>(Class: ClassTypeWithTokens<T, TDeps>, dependencyTokens?: readonly [...TupleToTokens<TDeps>]): IBinding<T> {
		return createBinding(this.token, new ClassProvider(Class, dependencyTokens as any));
	}

	/**
	 * Binds the token to an async factory, which returns a class which will be constructed when providing it
	 *
	 * @param factory Factory which returns a promise to a class type
	 * @param dependencyTokens Tokens to inject into the constructor
	 */
	public toAsyncClass<TDeps extends any[], CLS extends new (...deps: TDeps) => T>(
		factory: () => Promise<CLS | { default: CLS; }>,
		dependencyTokens: readonly [...TupleToTokens<TDeps>]
	): IBinding<T> {
		return createBinding(this.token, new AsyncClassProvider(factory, dependencyTokens));
	}

	/**
	 * Binds the token to an async factory which constructs a class.
	 *
	 * @param factory Factory which returns either:
	 * - Class with no dependencies
	 * - Class which has been decorated with static dependency tokens
	 *
	 * @example
	 * bindAsyncClass(TargetToken, () => import('./someModule').then(m => m.MyClassWithStaticDeps));
	 *
	 * // requires class decorated like this:
	 * class _MyClassWithStaticDeps {
	 *     static [ClassDependencyTokensSymbol] = [Dep1Token, Dep2Token] as const;
	 *     constructor(public dep1: Dep1, public dep2: Dep2) { }
	 * }
	 */
	public toLazyAsyncClass<TDeps extends any[], CLS extends ClassType<T, TDeps>>(factory: LazyClassProviderFactory<CLS, TDeps>): IBinding<T> {
		return createBinding(this.token, new LazyClassProvider(factory));
	}
}

/**
 * Start binding a token.
 * 
 * @param token The token to bind
 */
export function bind<T>(token: IToken<T>) {
	return new UnprovidedBinding<T>(token);
}
