import { Injector, createToken, bind, CyclicDependencyError } from '../src/index.ts';
import type { ILazy } from '../src/index.ts';

class CyclicErrorA {
    public readonly b: CyclicErrorB;
    constructor(b: CyclicErrorB) {
        this.b = b;
    }
}

class CyclicErrorB {
    public readonly a: CyclicErrorA;
    constructor(a: CyclicErrorA) {
        this.a = a;
    }
}

class CyclicFixA {
    public readonly b: CyclicFixB;
    constructor(b: CyclicFixB) {
        this.b = b;
    }

    public foo() {
        // console.log("foo");
    }
}

class CyclicFixB {
    private readonly lazyA: ILazy<CyclicFixA>;
    constructor(lazyA: ILazy<CyclicFixA>) {
        this.lazyA = lazyA;
    }

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
    await expect(b.foo()).resolves.toBeUndefined();
});
