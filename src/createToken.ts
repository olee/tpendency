import { addDevtoolsFormatter } from './devtoolsFormatters.js';

import { IToken, ILazy } from './types.js';

const TokenSymbol = Symbol('token');

let createTokenIdx = 0;

/** */
function _createToken<T>(name?: string, isLazy?: true): IToken<T> {
    const debugName = name || `Token-${createTokenIdx++}`;
    let lazyToken: IToken<ILazy<T>>;
    return Object.freeze({
        [TokenSymbol]: true,
        debugName,
        isLazy,
        /** */
        get lazy() {
            if (isLazy) {
                throw new Error('Accessing lazy token on token which is already a lazy token');
            }
            if (!lazyToken) {
                lazyToken = _createToken<ILazy<T>>(`Lazy(${debugName})`, true);
            }
            return lazyToken;
        },
        toString() {
            return debugName;
        },
        toJSON() {
            return `[Token ${debugName}]`;
        }
    });
}

addDevtoolsFormatter({
    header: function (obj: any) {
        if (typeof obj !== 'object' || !obj[TokenSymbol]) {
            return null;
        }
        return ["object", { object: `[Token ${obj}]` }];
    },
    hasBody: function () {
        return false;
    }
});

/**
 * A token is an abstract representation of a dependency of a given type.
 */
export default function createToken<T>(debugName?: string): IToken<T> {
    return _createToken(debugName);
}
