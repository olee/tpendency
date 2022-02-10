
export interface ILazy<T> {
    get(): Promise<T>;
}

export interface IToken<T> {
    readonly debugName: string;
    readonly lazy: IToken<ILazy<T>>;
    readonly isLazy?: true;
    /** This property is required to make typescript check if two token types are compatible to each other */
    readonly surrogate?: T;
    toString(): string;
}

/**
 * A provider is recipe for building a value that may have dependencies.
 */
export interface IProvider<T, TDeps extends readonly any[] = readonly any[]> {
    get(dependencies: TDeps): Promise<T>;
    getDependencyTokens(): TupleToTokens<TDeps> | Promise<TupleToTokens<TDeps>>;
}

export interface IBinding<T = unknown> {
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
