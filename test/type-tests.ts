import { createToken, ClassDependencyTokensSymbol, bindClass, bindLazyClass } from '../src/index.ts';

const Dep1Token = createToken<Dep1>('dep1');
const Dep2Token = createToken<Dep2>('dep2');
const StoreToken = createToken<Store>('store');

class Dep1 {
    public str = '';
}

class Dep2 {
    public num = 1;
}

class Store {
    public dep1: Dep1;
    public dep2: Dep2;
    constructor(dep1: Dep1, dep2: Dep2) {
        this.dep1 = dep1;
        this.dep2 = dep2;
    }
}

class StoreWithInject {
    static [ClassDependencyTokensSymbol] = [Dep1Token, Dep2Token] as const;
    public dep1: Dep1;
    public dep2: Dep2;
    constructor(dep1: Dep1, dep2: Dep2) {
        this.dep1 = dep1;
        this.dep2 = dep2;
    }
}

bindClass(Dep1Token, Dep1);
bindClass(StoreToken, Store, [Dep1Token, Dep2Token]);
bindClass(StoreToken, StoreWithInject);
// ERRORS
// bindClass(StoreToken, Store);
// bindClass(StoreToken, Store, [Dep1Token]);
// bindClass(StoreToken, Store, [Dep1Token, Dep2Token, Dep2Token]);

bindLazyClass(StoreToken, () => Promise.resolve().then(() => StoreWithInject));

// ERRORS
// bindLazyClass(Dep1Token, () => Promise.resolve().then(() => Dep1));
// bindLazyClass(Dep2Token, () => Promise.resolve().then(() => Dep2));
// bindLazyClass(StoreToken, () => Promise.resolve().then(() => Store));
