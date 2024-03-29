import { IToken } from './types.js';

/**
 * Error thrown a dependency cycle is detected at runtime.
 */
export class CyclicDependencyError extends Error {
    public name = 'CyclicDependencyError';
    public message: string;

    constructor(tokenChain: IToken<any>[]) {
        super();
        this.message = tokenChain.map(t => t.debugName).join(' -> ');
    }
}

/**
 * Error thrown when attempting to call Injector#get(token) where token is not bound on the injector.
 */
export class UnboundTokenError extends Error {
    public name = 'UnboundTokenError';

    constructor(token: IToken<any>) {
        super();
        this.message = `Tried to get ${token.debugName} from an injector, but it's not bound.`;
    }
}
