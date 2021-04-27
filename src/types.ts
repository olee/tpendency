
export interface ILazy<T> {
    get(): Promise<T>;
}

export interface IToken<T> {
    readonly debugName: string;
    readonly lazy: IToken<ILazy<T>>;
    readonly isLazy?: true;
    /** This property is required to make typescript check if two token types are compatible to each other */
    readonly surrogate?: T;
}

export interface IProviderBase<T, TDeps extends readonly any[] = readonly any[]> {
    get(dependencies: TDeps): Promise<T>;
}

export interface IProviderAsync<T, TDeps extends readonly any[] = readonly any[]> extends IProviderBase<T, TDeps> {
    getDependencyTokens(): Promise<TupleToTokens<TDeps>>;
}

export interface IProviderSync<T, TDeps extends readonly any[] = readonly any[]> extends IProviderBase<T, TDeps> {
    dependencyTokens: TupleToTokens<TDeps>;
}

/**
 * A provider is recipe for building a value that may have dependencies.
 */
export type IProvider<T, TDeps extends readonly any[] = readonly any[]> = IProviderSync<T, TDeps> | IProviderAsync<T, TDeps>;

export interface IBinding<T> {
    token: IToken<T>;
    provider: IProvider<T>;
}

export interface ClassType<TInstance = any, TParams extends readonly any[] = readonly any[]> {
    new(...args: TParams): TInstance;
}

export type TupleToTokens<T extends readonly any[]> = { [i in keyof T]: IToken<T[i]> };

export const ClassDependencyTokensSymbol = Symbol('dependencyTokens');

export interface ClassTypeWithTokens<T = any, TParams extends readonly any[] = readonly any[]> extends ClassType<T, TParams> {
    readonly [ClassDependencyTokensSymbol]: TupleToTokens<TParams>;
}

export interface InjectedTokens<TParams extends readonly any[] = readonly any[]> {
    readonly [ClassDependencyTokensSymbol]: TupleToTokens<TParams>;
}
