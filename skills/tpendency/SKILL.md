---
name: tpendency
description: >-
  Type-safe async dependency injection with tpendency: tokens, Injector,
  bindings (value, factory, class, async, lazy), and nested injectors.
  Use when wiring dependencies with tpendency, creating tokens/bindings,
  or resolving CyclicDependencyError.
---

# tpendency

Async dependency injection for TypeScript with compile-time type safety.

## Core concepts

| Concept      | Role                                                         |
| ------------ | ------------------------------------------------------------ |
| **Token**    | Type-safe identifier: `createToken<T>('Name')` → `IToken<T>` |
| **Provider** | Knows how to produce `T` from dependency values              |
| **Binding**  | Maps one token to one provider                               |
| **Injector** | Resolves tokens; caches singletons per instance              |

## Minimal setup

```typescript
import { bind, createToken, Injector } from 'tpendency';

const AToken = createToken<number>('A');
const BToken = createToken<number>('B');
const SumToken = createToken<number>('Sum');

const injector = new Injector([
  bind(AToken).toValue(1),
  bind(BToken).toValue(3),
  bind(SumToken).toFactory((a, b) => a + b, [AToken, BToken]),
]);

await injector.get(SumToken); // 4
```

## Creating tokens

`createToken<T>('Name')` creates an opaque token that can be used to resolve a dependency.
The string passed to `createToken` is only used for debugging and error messages and has no other significance.


## Binding types

### Value — constant, no deps

```typescript
bind(HelloToken).toValue('hello');
```


### Token alias — same instance as another token

```typescript
bind(WorldToken).toToken(HelloToken);
```


### Factory — sync function

```typescript
bind(HelloWorldToken).toFactory(
  (hello, world) => `${hello} ${world}!`,
  [HelloToken, WorldToken],
);
```


### Async factory — async construction

```typescript
bind(HelloWorldToken).toAsyncFactory(
  async (hello, world) => {
    await setup();
    return `${hello} ${world}!`;
  },
  [HelloToken, WorldToken],
);
```


### Class — `new Class(...deps)`

**Recommended:** declare constructor dependencies on the class itself (see [Class dependency tokens](#class-dependency-tokens-recommended) below), then bind without repeating the token list:

```typescript
bind(Token).toClass(ParameterlessConstructorClass);
bind(Token).toClass(StaticTokensClass);
bind(Token).toClass(ClassWithDependencies, [TokenA, TokenB]);
```

### Async class — dynamic import / code splitting

```typescript
bind(LoggerToken).toAsyncClass(
  () => import('./Logger').then((m) => m.Logger),
  [PrefixToken],
);
```

The function passed may return the class directly or withing an object as `{ default: Class }` for compatibility with ESM imports.

## Class dependency tokens (recommended)

For any class constructed via `toClass`, you can **co-locate its DI tokens** as the static symbol property `ClassDependencyTokensSymbol` on the class.
This keeps the constructor parameter list and binding module in sync — the composition root only needs `bind(XToken).toClass(X)`.

```typescript
import { ClassDependencyTokensSymbol, type ClassTokens } from 'tpendency';

export class MyClass {
  public static readonly [ClassDependencyTokensSymbol]: ClassTokens<typeof CheckoutManager> = [
    TokenA,
    TokenB,
  ];

  constructor(
    logger: A,
    config: B,
  ) {
    // ...
  }
}
```

## Injector API

```typescript
await injector.get(Token);           // resolve (cached after first call)
await injector.all([T1, T2]);        // resolve multiple
await injector.reset(disposeValues); // reset the injector dropping all values and optionally dispose all instantiated, disposable values
injector.getIfInstantiated(Token);   // cached value or undefined
injector.isInstantiated(Token);
injector.registerBinding(binding);   // add/override at runtime
```

- Injector implements `AsyncDisposable`. Disposing it will dispose all instantiated dependencies implementing either `Disposable` or `AsyncDisposable`.

## Nested injectors — overrides (e.g. tests)

Child injectors fall back to the parent for unbound tokens:

```typescript
const parent = new Injector([bind(ConfigToken).toValue(prodConfig)]);
const child = new Injector(
  [bind(ConfigToken).toValue(testConfig)],
  parent,
);
await child.get(ConfigToken); // testConfig
```

## Lazy dependencies — break cycles

Circular bindings throw `CyclicDependencyError`. Use `ILazy<T>` and `Token.lazy`:

```typescript
import type { ILazy } from 'tpendency';

class B {
  constructor(private lazyA: ILazy<A>) {}
  async run() {
    const a = await this.lazyA.get();
    a.doWork();
  }
}

const injector = new Injector([
  bind(AToken).toClass(A, [BToken]),
  bind(BToken).toClass(B, [AToken.lazy]), // lazy, not AToken
]);
```

Lazy deps are not resolved until `await lazy.get()` is called.

## Tokens — best practices

- Prevent circular depdencies:
  Export tokens from a dedicated module; use `import type` for types referenced in `createToken<T>()`.
  Avoid runtime imports in the tokens module (prevents circular deps and unwanted bundle coupling)
- Tokens **MUST** always be provided in the same order as the constructor / factory order.
- For `toClass` targets, declare `[ClassDependencyTokensSymbol]` on the class for co-location of tokens and parameters
- **Resolution is always async:** `await injector.get(Token)`.

## Anti-patterns

- String/symbol locators instead of `IToken<T>`
- Forgetting `await` on `injector.get()`
- Eager mutual ctor deps without `Token.lazy`
