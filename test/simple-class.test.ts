import { Injector, createToken, bind } from '../src/index.ts';

test('Simple classes with dependencies', async () => {
    class ClassA {
        public readonly someValue = 1;
    }

    class ClassB {
        public readonly classA: ClassA;
        constructor(classA: ClassA) {
            this.classA = classA;
        }
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
