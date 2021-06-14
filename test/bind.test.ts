import { Injector, createToken, bind } from '../src';
import { ILogger, Logger } from './Logger';

const HelloToken = createToken<string>();
const WorldToken = createToken<string>();
const HelloWorldToken = createToken<string>();

const LoggerPrefixToken = createToken<string>();
const LoggerToken = createToken<ILogger>();

test('bind.toValue', async () => {
    const injector = new Injector([
        bind(HelloToken).toValue('hello'),
    ]);
    expect(injector.get(HelloToken)).resolves.toEqual('hello');
});

test('bind.toToken', async () => {
    const injector = new Injector([
        bind(HelloToken).toValue('hello'),
        bind(WorldToken).toToken(HelloToken),
    ]);
    expect(injector.get(WorldToken)).resolves.toEqual('hello');
});

test('bind.toFactory', async () => {
    const injector = new Injector([
        bind(HelloToken).toValue('hello'),
        bind(WorldToken).toValue('world'),
        bind(HelloWorldToken).toFactory(
            (hello, world) => `${hello} ${world}!`,
            [HelloToken, WorldToken]
        ),
    ]);
    expect(injector.get(HelloWorldToken)).resolves.toEqual('hello world!');
});

test('bind.toAsyncFactory', async () => {
    const injector = new Injector([
        bind(HelloToken).toValue('hello'),
        bind(WorldToken).toValue('world'),
        bind(HelloWorldToken).toAsyncFactory(
            async (hello, world) => {
                // Fake some API call or whatever
                await new Promise(r => setTimeout(r, 10));
                return `${hello} ${world}!`;
            },
            [HelloToken, WorldToken]
        ),
    ]);
    expect(injector.get(HelloWorldToken)).resolves.toEqual('hello world!');
});

test('bind.toClass', async () => {
    const injector = new Injector([
        bind(LoggerPrefixToken).toValue('LOG'),
        bind(LoggerToken).toClass(Logger, [
            LoggerPrefixToken
        ]),
    ]);
    expect(injector.get(LoggerToken)).resolves.toBeInstanceOf(Logger);
});

test('bind.toAsyncClass', async () => {
    const injector = new Injector([
        bind(LoggerPrefixToken).toValue('LOG'),
        bind(LoggerToken).toAsyncClass(
            () => import('./Logger').then(m => m.Logger),
            [LoggerPrefixToken]
        ),
    ]);
    expect(injector.get(LoggerToken)).resolves.toBeInstanceOf(Logger);
});
