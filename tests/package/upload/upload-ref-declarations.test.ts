import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, test } from 'vitest';

test('checks the public UploadDragger ref and its emitted declarations in strict mode', () => {
  const fixtureURL = new URL('./upload-ref.types.ts', import.meta.url);
  const entry = fileURLToPath(fixtureURL);
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    strict: true,
    skipLibCheck: false,
    types: ['vite/client']
  };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram([entry], options, host);

  const diagnostics = ts.getPreEmitDiagnostics(program);

  expect(ts.formatDiagnostics(diagnostics, host)).toBe('');
});
