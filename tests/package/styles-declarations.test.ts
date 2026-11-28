import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, test } from 'vitest';

test('publishes stylesheet declarations for TypeScript consumers without ambient CSS types', () => {
  const entry = fileURLToPath(new URL('./styles.types.ts', import.meta.url));
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    noUncheckedSideEffectImports: true,
    strict: true,
    skipLibCheck: false,
    types: []
  };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram([entry], options, host);

  expect(ts.formatDiagnostics(ts.getPreEmitDiagnostics(program), host)).toBe('');
});

test('resolves the public stylesheet to the built CSS file at runtime', () => {
  const require = createRequire(import.meta.url);
  const expected = fileURLToPath(new URL('../../dist/styles.css', import.meta.url));

  expect(require.resolve('@woodger/antd/styles.css')).toBe(expected);
});
