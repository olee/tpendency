import type { IProvider } from '../types.ts';

/**
 * Provider that gets values by returning a constant value. 
 */
export class ValueProvider<T> implements IProvider<T> {

	private readonly _value: T;

	constructor(_value: T) {
		this._value = _value;
	}

	public getDependencyTokens() { return []; }

	public get(): Promise<T> {
		return Promise.resolve(this._value);
	}

}
