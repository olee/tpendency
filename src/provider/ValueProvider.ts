import type { IProvider } from '../types.js';

/**
 * Provider that gets values by returning a constant value. 
 */
export class ValueProvider<T> implements IProvider<T> {

	constructor(
		private readonly _value: T
	) { }

	public getDependencyTokens() { return []; }

	public get(): Promise<T> {
		return Promise.resolve(this._value);
	}

}
