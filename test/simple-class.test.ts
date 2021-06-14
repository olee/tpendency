import { Injector, createToken, bind } from '../src';

test('Simple classes with dependencies', async () => {
    class ClassA {
        public readonly someValue = 1;
    }

    class ClassB {
        constructor(
            public readonly classA: ClassA,
        ) { }
    }
    const ClassAToken = createToken<ClassA>('ClassA');
    const ClassBToken = createToken<ClassB>('ClassB');
    const injector = new Injector([
        bind(ClassAToken).toClass(ClassA),
        bind(ClassBToken).toClass(ClassB, [ClassAToken]),
    ]);

    const classB = await injector.get(ClassBToken);
    expect(classB).toBeInstanceOf(ClassB);
});
