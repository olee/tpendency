import type { IToken, IProviderSync } from '../types.js';

/**
 * Provider that gets values by returning a constant value. 
 */
export class ValueProvider<T> implements IProviderSync<T> {

	public dependencyTokens: IToken<any>[] = [];

	private _value: T;

	constructor(value: T) {
		this._value = value;
	}

	public get(): Promise<T> {
		return Promise.resolve(this._value);
	}

}
