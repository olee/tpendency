import { Injector, createToken, bind, ILazy, CyclicDependencyError } from '../src';

class CyclicErrorA {
    constructor(
        public readonly b: CyclicErrorB,
    ) { }
}

class CyclicErrorB {
    constructor(
        public readonly a: CyclicErrorA,
    ) { }
}

class CyclicFixA {
    constructor(
        public readonly b: CyclicFixB,
    ) { }

    public foo() {
        // console.log("foo");
    }
}

class CyclicFixB {
    constructor(
        private readonly lazyA: ILazy<CyclicFixA>,
    ) { }

    public async foo() {
        const a = await this.lazyA.get();
        a.foo();
    }
}

const CyclicErrorAToken = createToken<CyclicErrorA>('CyclicErrorA');
const CyclicErrorBToken = createToken<CyclicErrorB>('CyclicErrorB');

const CyclicFixAToken = createToken<CyclicFixA>('CyclicFixA');
const CyclicFixBToken = createToken<CyclicFixB>('CyclicFixB');

const bindings = [
    bind(CyclicErrorAToken).toClass(CyclicErrorA, [CyclicErrorBToken]),
    bind(CyclicErrorBToken).toClass(CyclicErrorB, [CyclicErrorAToken]),
    bind(CyclicFixAToken).toClass(CyclicFixA, [CyclicFixBToken]),
    bind(CyclicFixBToken).toClass(CyclicFixB, [CyclicFixAToken.lazy]),
];

test('Cyclic dependency error', async () => {
    const injector = new Injector(bindings);
    await expect(injector.get(CyclicErrorBToken)).rejects.toThrow(CyclicDependencyError);
});

test('Cyclic dependency fix', async () => {
    const injector = new Injector(bindings);
    const b = await injector.get(CyclicFixBToken);
    expect(b).toBeInstanceOf(CyclicFixB);
    expect(b.foo()).resolves.toBeUndefined();
});
