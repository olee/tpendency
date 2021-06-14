import { Injector, createToken, bind } from '../src';

const HelloToken = createToken<string>();
const WorldToken = createToken<string>();
const HelloWorldToken = createToken<string>();

test('Injector nesting', async () => {
    const parentInjector = new Injector([
        bind(HelloToken).toValue("hello"),
        bind(WorldToken).toValue("world"),
    ]);
    const childInjector = new Injector([
        bind(HelloWorldToken).toFactory(
            (hello, world) => `${hello} ${world}!`,
            [HelloToken, WorldToken],
        ),
    ], parentInjector);
    expect(childInjector.get(HelloWorldToken)).resolves.toEqual("hello world!");
});
