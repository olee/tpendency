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
}

class CyclicFixB {
    public a?: CyclicFixA;
    constructor(
        lazyA: ILazy<CyclicFixA>,
    ) {
        lazyA.get().then(x => this.a = x);
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
    await expect(injector.get(CyclicErrorAToken)).rejects.toThrow(CyclicDependencyError);
});

test('Cyclic dependency fix', async () => {
    const injector = new Injector(bindings);
    const a = await injector.get(CyclicFixAToken);
    expect(a).toBeInstanceOf(CyclicFixA);
    expect(a.b).toBeInstanceOf(CyclicFixB);
});
