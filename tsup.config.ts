import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        outDir: 'lib/esm',
        clean: true,
        sourcemap: true,
    },
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        outDir: 'lib/cjs',
        sourcemap: true,
    },
]);
