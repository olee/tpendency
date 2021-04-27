import { ClassType, TupleToTokens } from './types.js';

export const ClassDependencyTokensSymbol = Symbol('dependencyTokens');

export interface ClassTypeWithTokens<T = any, TParams extends readonly any[] = readonly any[]> extends ClassType<T, TParams> {
    readonly [ClassDependencyTokensSymbol]: TupleToTokens<TParams>;
}

export interface InjectedTokens<TParams extends readonly any[] = readonly any[]> {
    readonly [ClassDependencyTokensSymbol]: TupleToTokens<TParams>;
}
