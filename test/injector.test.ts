import { Injector, createToken, bind, IBinding } from '../src';

const FortyTwoToken = createToken<42>();
const HelloToken = createToken<string>();
const WorldToken = createToken<string>();
const HelloWorldToken = createToken<string>();

const bindings: IBinding[] = [
    bind(FortyTwoToken).toValue(42),
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
];

test('injector.get - sync', async () => {
    const injector = new Injector(bindings);
    await expect(injector.get(HelloToken)).resolves.toEqual('hello');
    await expect(injector.get(WorldToken)).resolves.toEqual('world');
    await expect(injector.get(HelloWorldToken)).resolves.toEqual('hello world!');
});

test('injector.all', async () => {
    const injector = new Injector(bindings);
    const tokens = [
        FortyTwoToken,
        HelloToken,
        WorldToken,
        HelloWorldToken
    ] as const;
    await expect(injector.all(tokens)).resolves.toEqual([
        42,
        'hello',
        'world',
        'hello world!',
    ]);
});

test('injector.getSuspense - sync', async () => {
    const injector = new Injector(bindings);
    // Ensure promise is thrown when token is unresolved
    expect(() => injector.getSuspense(HelloToken)).toThrow();
    // Ensure token is resolved
    await injector.get(HelloToken);
    // Validate return value when token is resolved
    expect(injector.getSuspense(HelloToken)).toEqual('hello');
});

test('injector.getSuspense - async', async () => {
    const injector = new Injector(bindings);
    // Ensure promise is thrown when token is unresolved
    expect(() => injector.getSuspense(HelloWorldToken)).toThrow();
    // Ensure token is resolved
    await injector.get(HelloWorldToken);
    // Validate return value when token is resolved
    expect(injector.getSuspense(HelloWorldToken)).toEqual('hello world!');
});

test('injector.allSuspense', async () => {
    const injector = new Injector(bindings);
    const tokens = [
        FortyTwoToken,
        HelloToken,
        WorldToken,
        HelloWorldToken
    ] as const;
    // Ensure promise is thrown when token is unresolved
    expect(() => injector.allSuspense(tokens)).toThrow();
    // Ensure token is resolved
    await injector.get(HelloWorldToken);
    // Validate return value when token is resolved
    expect(injector.allSuspense(tokens)).toEqual([
        42,
        'hello',
        'world',
        'hello world!',
    ]);
});
