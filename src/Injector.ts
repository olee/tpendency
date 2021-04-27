import type { IToken, IBinding, IProvider, IProviderAsync, IProviderSync } from './types.js';

import { NoBoundTokenError, CyclicDependencyError } from './errors.js';
import { bindValue } from './binding.js';

export interface IInjector {
    get<T>(token: IToken<T>): Promise<T>;
}

/** Checks, if a provider is of type IProviderSync */
export function isSyncProvider(provider: IProvider<any>): provider is IProviderSync<any> {
    return Array.isArray((provider as IProviderSync<any>).dependencyTokens);
}

/** Checks, if a provider is of type IProviderAsync */
export function isAsyncProvider(provider: IProvider<any>): provider is IProviderAsync<any> {
    return typeof (provider as IProviderAsync<any>).getDependencyTokens === 'function';
}

/**
 * An Injector resolves tokens to values via bindings.
 */
export default class Injector implements IInjector {

    private _parent?: IInjector;

    private readonly _bindings = new Map<IToken<any>, IBinding<any>>();

    private readonly _cache = new Map<IToken<any>, Promise<any>>();

    private readonly _tokenInstanceMap = new Map<IToken<any>, any>();

    private readonly _tokenErrorMap = new Map<IToken<any>, any>();

    private readonly _instanceTokenMap = new Map<any, IToken<any>>();

    // TODO-3: Replace with event subscriber
    public onInstantiate?: <T>(token: IToken<T>, obj: T) => void;

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

    /** Returns an array of all non-lazy tokens know to this injector */
    public get tokens() {
        return Array.from(this._bindings.keys()).filter(x => !x.isLazy);
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
        this._bindings.set(binding.token, binding);
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
    public get<T>(token: IToken<T>, indexLog: Set<IToken<any>> = new Set(), tokenChain: IToken<any>[] = []): Promise<T> {
        let promise = this._cache.get(token);
        if (!promise) {
            promise = this._get(token, indexLog, tokenChain).then(result => {
                // Add to instance cache
                this._tokenInstanceMap.set(token, result);
                this._instanceTokenMap.set(result, token);
                this.onInstantiate?.(token, result);
                return result;
            }).catch(error => {
                this._tokenErrorMap.set(token, error);
                throw error;
            });
            // TODO: Some kind of after-create callback might be useful?
            // promise.then(result => {
            //     if (typeof result === 'object' && typeof result.$onAfterInjectorCreate === 'function') {
            //         return result.$onAfterInjectorCreate();
            //     }
            // });
            this._cache.set(token, promise);
        }
        return promise;
    }

    public getTokenForInstance<T>(instance: T): IToken<T> | undefined {
        return this._instanceTokenMap.get(instance);
    }

    public isInstantiated<T>(token: IToken<T>) {
        return this._tokenInstanceMap.has(token);
    }

    public getError(token: IToken<any>) {
        return this._tokenErrorMap.get(token);
    }

    /** Returns the value for the token if it was already resolved, otherwise returns undefined */
    public getIfInstantiated<T>(token: IToken<T>): T | undefined {
        return this._tokenInstanceMap.get(token);
    }

    /** React-Suspense compatible resolver */
    public getSuspense<T>(token: IToken<T>): T {
        if (this._tokenInstanceMap.has(token)) {
            return this._tokenInstanceMap.get(token);
        } else if (this._tokenErrorMap.has(token)) {
            throw this._tokenErrorMap.get(token);
        }
        throw this.get(token);
    }

    private _get<T>(token: IToken<T>, indexLog: Set<IToken<any>>, tokenChain: IToken<any>[] = []): Promise<T> {
        const binding = this._bindings.get(token);
        if (binding) {
            return this._resolveFromProvider(binding, indexLog, tokenChain);
        } else {
            return this._resolveFromParent(token);
        }
    }

    /**
     * Resolve the token through the parent.
     * If no parent is set, a NoBoundTokenError error will be thrown
     */
    private _resolveFromParent<T>(token: IToken<T>): Promise<T> {
        if (this._parent) {
            return this._parent.get(token);
        } else {
            throw new NoBoundTokenError(token);
        }
    }

    private _resolveFromProvider<T>(binding: IBinding<T>, indexLog: Set<IToken<any>>, tokenChain: IToken<any>[]): Promise<T> {
        const { token, provider } = binding;
        tokenChain.push(token);

        // detect cyclic dependencies issues
        if (indexLog.has(token)) {
            throw new CyclicDependencyError(tokenChain);
        }
        indexLog.add(token);

        // check for async dependencies
        if (isAsyncProvider(provider)) {
            return provider.getDependencyTokens().then(dependencyTokens => {
                // get dependencies
                const dependencyPromises = dependencyTokens?.map(depToken => {
                    return this.get(depToken, new Set(indexLog), tokenChain.slice());
                });

                // await dependencies and provide result
                return !dependencyPromises ?
                    provider.get([]) :
                    Promise.all(dependencyPromises).then(dependencies => provider.get(dependencies));
            });
        } else {
            // get dependencies
            const dependencyPromises = provider.dependencyTokens?.map(depToken => {
                return this.get(depToken, new Set(indexLog), tokenChain.slice());
            });

            // await dependencies and provide result
            return !dependencyPromises ?
                provider.get([]) :
                Promise.all(dependencyPromises).then(dependencies => provider.get(dependencies));
        }
    }

}
