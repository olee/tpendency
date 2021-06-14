# tpendency: Type-Safe Dependency Injection Library

[![npm version](https://badge.fury.io/js/tpendency.svg)](https://badge.fury.io/js/tpendency)

Tpendency is an asynchronous dependency injection library for TypeScript which
focuses on type-safety.

It was heavily inspired by [tpendency](https://github.com/matthewjh/Syringe) and
extends it with better typings and more features like React-Suspense support
etc.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [TypeScript Support](#typescript+support)
- [Bindings](#bindings)
- [Lazy Dependencies](#lazy-dependencies)
- [Injector Nesting](#injector-nesting)

## Installation

Simply install from npm via `tpendency` package with your preferred package
manager (npm, yarn & co.)

## Basic Usage

To start using tpendency, you will have to create a set of tokens with
`createToken<T>()` first, which will return a unique symbol for your dependency.
Then you can create an `Injector` with a list of bindings, which will which
connect tokens to various providers, which tell the injector on how to
instantiate the values for their respective token.

```typeScript
import { bind, createToken, Injector } from "tpendency";

// Create tokes to identify dependencies
const NumberAToken = createToken<number>("A");
const NumberBToken = createToken<number>("B");
const SumToken = createToken<number>("A+B");

// Create an injector with bindings to use as a DI container
const injector = new Injector([
  bind(NumberAToken).toValue(1),
  bind(NumberBToken).toValue(3),
  bind(SumToken).toFactory((a, b) => a + b, [
    NumberAToken,
    NumberBToken,
  ]),
]);

console.log(await injector.get(TwoToken)); // logs 4
```

## TypeScript Support

In order to provide type-safety, this library does not use strings or symbols as
identifiers for dependencies. Instead it uses small objects returned by
`createToken<T>()` which have the type `IToken<T>`. This allows the injector to
properly know which type will be returned for a certain token by simply
utilizing the following signature:

```typescript
Injector.get<T>(token: IToken<T>): Promise<T>;
```

In the same way, all binding and provider types will prevent passing tokens of
the incorrect type as dependencies to other bindings:

```typescript
const StringToken = createToken<string>();
const PlusTenToken = createToken<number>();
bind(PlusTenToken).toFactory((x: number) => x + 10, [StringToken]);
// The above statement will produce the following compile-time error at 'StringToken':
// Type 'IToken<string>' is not assignable to type 'IToken<number>'.
//   Type 'string' is not assignable to type 'number'.ts(2322)
```

Bindings for classes and factories will also ensure, that the tokens for all
required parameters are provided correctly.

Because this library uses TypeScript Tuple Types to provide type-safety for
tokens and bindings, you need at least TypeScript 4.0 to use this library.

## Bindings

<details>
<summary><em>Click to expand</em>

This section describes the various types of bindings supported by this library

</summary>

For all following examples, the following tokens are used if not specified
otherwise:

```typescript
// tokens.ts
const HelloToken = createToken<string>();
const WorldToken = createToken<string>();
const HelloWorldToken = createToken<string>();

const LoggerPrefixToken = createToken<string>();
const LoggerToken = createToken<ILogger>();
```

Also, the following code is used as example for class bindings (`./Logger.ts`):

```typescript
// ./Logger.ts
export interface ILogger {
  log(...args: any[]): void;
}

export class Logger implements ILogger {
  constructor(
    public readonly prefix: string,
  ) {}

  public log(...args: any[]) {
    console.log(this.prefix, ...args);
  }
}
```

### toValue & bindValue (ValueProvider)

Binds the token to a constant value.

```typeScript
const injector = new Injector([
  bind(HelloToken).toValue("hello"),
]);
expect(injector.get(HelloToken)).resolves.toEqual("hello");
```

### toToken & bindToToken (through FactoryProvider)

Binds the token to the value of another token.

```typeScript
const injector = new Injector([
  bind(HelloToken).toValue("hello"),
  bind(WorldToken).toToken(HelloToken),
]);
expect(injector.get(WorldToken)).resolves.toEqual("hello");
```

### toFactory & bindFactory (FactoryProvider)

Binds the token to a factory function.

```typeScript
const injector = new Injector([
  bind(HelloToken).toValue("hello"),
  bind(WorldToken).toValue("world"),
  bind(HelloWorldToken).toFactory(
    (hello, world) => `${hello} ${world}!`,
    [HelloToken, WorldToken],
  ),
]);
expect(injector.get(HelloWorldToken)).resolves.toEqual("hello world!");
```

### toAsyncFactory & bindAsyncFactory (AsyncFactoryProvider)

Binds the token to an asynchronous factory function.

```typeScript
const injector = new Injector([
  bind(HelloToken).toValue("hello"),
  bind(WorldToken).toValue("world"),
  bind(HelloWorldToken).toAsyncFactory(
    async (hello, world) => {
      // Fake some API call or whatever
      await new Promise((r) => setTimeout(r, 10));
      return `${hello} ${world}!`;
    },
    [HelloToken, WorldToken],
  ),
]);
expect(injector.get(HelloWorldToken)).resolves.toEqual("hello world!");
```

### toClass & bindToClass (ClassProvider)

Binds the token to a class which will be constructed when the dependency is
provided. The dependencies of the class will be passed into the constructor
automatically. The dependency array can be omitted, if the class has a
parameterless constructor.

```typeScript
import { Logger } from "./Logger";

const injector = new Injector([
  bind(LoggerPrefixToken).toValue("MyPrefix:"),
  bind(LoggerToken).toClass(Logger, [
    LoggerPrefixToken,
  ]),
]);
expect(injector.get(LoggerToken)).resolves.toBeInstanceOf(Logger);
```

### toAsyncClass & bindToAsyncClass (AsyncClassProvider)

Binds the token to an asynchronous function which should return a class type.
The class is then instantiated in the same way as with `ClassProvider`.

This is useful for code splitting in larger projects by using the import
function as provider for the class:

```typeScript
const injector = new Injector([
  bind(LoggerPrefixToken).toValue("LOG"),
  bind(LoggerToken).toAsyncClass(
    () => import("./Logger").then((m) => m.Logger),
    [LoggerPrefixToken],
  ),
]);
expect(injector.get(LoggerToken)).resolves.toBeInstanceOf(Logger);
```

</details>

## Cyclic Dependencies

When two bindings depend on each other, this results in a cyclic dependency and
a `CyclicDependencyError` will be thrown.

To resolve this, either rewrite your code to not introduce cyclic dependencies
or use a [lazy token binding](#lazy+dependencies).

## Lazy Dependencies

Sometimes it is desirable to construct a dependency in a context after that
context has been created by the injector. This is also useful to solve cyclic
dependency errors.

This is achieved by using `ILazy<T>` instead of your type `T` in your class or
factory and `MyToken.lazy` instead of `MyToken` for the token. `ILazy<T>` is an
object with a `get(): Promise<T>` function. The dependency `T` will not be
resolved until the `get` function is called.

<details>
<summary><em>Click to expand</em>

This code will produce a `CyclicDependencyError`, because both classes depend on each other

</summary>

```typeScript
import { bind, Inject, Injector } from "tpendency";

class CyclicErrorA {
  constructor(private b: B) {}

  public logTest() {
    console.log("logTest");
  }
}

class CyclicErrorB {
  constructor(private a: A) {}

  public logTest() {
    this.a.logTest();
  }
}

const AToken = createToken<CyclicErrorA>();
const BToken = createToken<CyclicErrorB>();

const injector = new Injector([
  bind(CyclicErrorAToken).toClass(CyclicErrorA, [CyclicErrorBToken]),
  bind(CyclicErrorBToken).toClass(CyclicErrorB, [CyclicErrorAToken]),
]);

// Throws CyclicDependencyError, because both classes depend on each other
await expect(injector.get(CyclicErrorBToken)).rejects
  .toThrow(CyclicDependencyError);
```

</details>

<details>
<summary><em>Click to expand</em>

This code uses a lazy binding on `CyclicFixB` to solve the CyclicDependencyError

</summary>

Notice, how the `logTest` function on `B` had to be changed into an async
function `logTestAsync` to accommodate for the async invocation of
`ILazy<T>.get()`.

```typeScript
import { bind, Inject, Injector } from "tpendency";

class CyclicFixA {
  constructor(
    public readonly b: CyclicFixB,
  ) {}

  public logTest() {
    console.log("logTest");
  }
}

class CyclicFixB {
  constructor(
    private readonly lazyA: ILazy<CyclicFixA>,
  ) {}

  public async logTestAsync() {
    const a = await this.lazyA.get();
    a.logTest();
  }
}

const AToken = createToken<CyclicFixA>();
const BToken = createToken<CyclicFixB>();

const injector = new Injector([
  bind(CyclicFixAToken).toClass(CyclicFixA, [CyclicFixBToken]),
  bind(CyclicFixBToken).toClass(CyclicFixB, [CyclicFixAToken.lazy]),
]);

const b = await injector.get(CyclicFixBToken);
expect(b).toBeInstanceOf(CyclicFixB);
expect(b.logTestAsync()).resolves.toBeUndefined();
```

</details>

## Injector Nesting

You can pass an already created `Injector` as a parent for another `Injector`.
This will make the child try to resolve all dependencies it cannot find through
the parent `Injector`.

```typeScript
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
```
