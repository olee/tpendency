import type { IToken, IBinding, IProvider } from './types.js';
import { UnboundTokenError, CyclicDependencyError } from './errors.js';
import { bindValue } from './binding.js';
import { EventEmitter } from './EventEmitter.js';

export interface IInjector {
    get<T>(token: IToken<T>): Promise<T>;
}

export interface InjectorEvents {
    instantiate: <T>(token: IToken<T>, obj: T, dependencyTokens: readonly IToken<unknown>[], dependencies: readonly unknown[]) => void;
    instantiateCollectDeps: (token: IToken<unknown>, dependencyTokens: readonly IToken<unknown>[], dependencies: readonly unknown[]) => void;
    instantiateCollectDepTokens: (token: IToken<unknown>, dependencyTokens: readonly IToken<unknown>[]) => void;
    instantiateCyclicError: (token: IToken<unknown>, tokenChain: readonly IToken<unknown>[]) => void;
    instantiateError: (token: IToken<unknown>, dependencyTokens: readonly IToken<unknown>[], error: unknown) => void;
}

/**
 * An Injector resolves tokens to values via bindings.
 */
export default class Injector implements IInjector {

    private _parent?: IInjector;

    private readonly _providers = new Map<IToken<any>, IProvider<any>>();

    private readonly _cache = new Map<IToken<any>, Promise<any>>();

    private readonly _tokenInstanceMap = new Map<IToken<any>, any>();

    private readonly _tokenErrorMap = new Map<IToken<any>, any>();

    private readonly _instanceTokenMap = new Map<any, IToken<any>>();

    private readonly eventEmitter = new EventEmitter<InjectorEvents>();

    /**
     * @param bindings Bindings to initialize this injector with
     * @param parent Parent injector, which will be used to resolve all tokens not bound to this injector
     */
    public constructor(bindings?: IBinding<any>[], parent?: IInjector) {
        this._parent = parent;
        if (bindings) {
            this.registerBindings(bindings);
        }
    }

    public readonly on = this.eventEmitter.on.bind(this.eventEmitter);

    /** Returns an array of all non-lazy tokens know to this injector */
    public get tokens() {
        return Array.from(this._providers.keys()).filter(x => !x.isLazy);
    }

    /**
     * Registers a list of bindings
     * 
     * @see Injector.registerBinding
     */
    public registerBindings(bindings: IBinding<any>[]) {
        for (const binding of bindings) {
            this.registerBinding(binding);
        }
    }

    /**
     * Register a binding with this injector.
     * Will throw an error, if the binding's token has already been resolved once.
     */
    public registerBinding(binding: IBinding<any>) {
        this._registerBinding(binding);
        this._registerBinding(this._createLazyBinding(binding.token));
    }

    private _registerBinding(binding: IBinding<any>) {
        if (this._cache.has(binding.token)) {
            throw new Error('Token has already been resolved once and cannot be overwritten');
        }
        this._providers.set(binding.token, binding.provider);
    }

    /**
     * Creates a lazy binding for a token
     * 
     * @param token The token to create a lazy binding for
     */
    private _createLazyBinding(token: IToken<any>) {
        return bindValue(token.lazy, {
            get: () => this.get(token)
        });
    }

    /**
     * Resolves the value for a token
     * 
     * @param token Token to resolve
     */
    public get<T>(token: IToken<T>, tokenChain: IToken<any>[] = []): Promise<T> {
        // Detect cyclic dependencies issues
        if (tokenChain.includes(token)) {
            this.eventEmitter.emit('instantiateCyclicError', token, tokenChain);
            throw new CyclicDependencyError(tokenChain);
        }
        let promise = this._cache.get(token);
        if (!promise) {
            promise = this._get(token, tokenChain).then(result => {
                // Add to instance cache
                this._tokenInstanceMap.set(token, result);
                this._instanceTokenMap.set(result, token);
                return result;
            }).catch(error => {
                this._tokenErrorMap.set(token, error);
                const depTokensPromise = this._providers.get(token)?.getDependencyTokens();
                if (!depTokensPromise || Array.isArray(depTokensPromise)) {
                    this.eventEmitter.emit('instantiateError', token, [], error);
                } else {
                    Promise.resolve(depTokensPromise).then((depTokens) => {
                        this.eventEmitter.emit('instantiateError', token, depTokens, error);
                    });
                }
                throw error;
            });
            this._cache.set(token, promise);
        }
        return promise;
    }

    /** 
     * This function uses {@link get} to resolve multiple dependencies at the same time using {@link Promise.all}
     */
    public all<T extends any[]>(tokens: readonly [...{ [k in keyof T]: IToken<T[k]> }]): Promise<T> {
        return Promise.all(tokens.map(token => this.get(token)) as T);
    }

    /** 
     * Try to return the token for a resolved value.
     */
    public getTokenForValue<T>(value: T): IToken<T> | undefined {
        return this._instanceTokenMap.get(value);
    }

    /**
     * Returns true, if the token has already been resolved
     */
    public isInstantiated<T>(token: IToken<T>) {
        return this._tokenInstanceMap.has(token);
    }

    /**
     * If the binding for a token threw an error, this function will return this error
     */
    public getError(token: IToken<any>) {
        return this._tokenErrorMap.get(token);
    }

    /** 
     * Returns the value for the token if it was already resolved, otherwise returns undefined 
     */
    public getIfInstantiated<T>(token: IToken<T>): T | undefined {
        return this._tokenInstanceMap.get(token);
    }

    /** 
     * React-Suspense compatible resolver 
     */
    public getSuspense<T>(token: IToken<T>): T {
        if (this._tokenInstanceMap.has(token)) {
            return this._tokenInstanceMap.get(token);
        } else if (this._tokenErrorMap.has(token)) {
            throw this._tokenErrorMap.get(token);
        }
        throw this.get(token);
    }

    /** 
     * Same as {@link getSuspense}, but can resolve multiple dependencies at the same time (see {@link all})
     */
    public allSuspense<T extends any[]>(tokens: readonly [...{ [k in keyof T]: IToken<T[k]> }]): T {
        if (tokens.every(token => this._tokenInstanceMap.has(token))) {
            return tokens.map(token => this._tokenInstanceMap.get(token)) as T;
        }
        const errorToken = tokens.find(token => this._tokenErrorMap.has(token));
        if (errorToken) {
            throw this._tokenErrorMap.get(errorToken);
        }
        throw this.all(tokens);
    }

    /**
     * Resolve the dependency through this injector or the parent.
     * If the tokens is neither bound in this injector or any parent, an UnboundTokenError error will be thrown
     */
    private _get<T>(token: IToken<T>, tokenChain: IToken<any>[] = []): Promise<T> {
        const provider = this._providers.get(token);
        if (provider) {
            return this._provide(token, provider, tokenChain);
        } else if (this._parent) {
            return this._parent.get(token);
        } else {
            throw new UnboundTokenError(token);
        }
    }

    private async _provide<T>(token: IToken<T>, provider: IProvider<T>, tokenChain: IToken<any>[]): Promise<T> {
        // Get dependency tokens
        const dependencyTokens = (await provider.getDependencyTokens()) || [];

        this.eventEmitter.emit('instantiateCollectDepTokens', token, dependencyTokens);

        // Await all dependencies
        const dependencies = dependencyTokens.length === 0 ? [] : await Promise.all(
            dependencyTokens.map(depToken => this.get(depToken, [...tokenChain, token]))
        );

        this.eventEmitter.emit('instantiateCollectDeps', token, dependencyTokens, dependencies);

        // provide value
        const result = await provider.get(dependencies);

        this.eventEmitter.emit('instantiate', token, result, dependencyTokens, dependencies);

        return result;
    }

}
