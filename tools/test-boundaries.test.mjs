// Checks the test harness boundary through source imports. Components load through the public
// package, and scenarios stay in the tests tree.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { registryFile } from './ant-design-common.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const testsRoot = join(root, 'tests');
const registryReader = join(testsRoot, 'porting-registry.ts');
const registrySource = join(root, registryFile);
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dependencies = new Set(Object.keys({
  ...metadata.peerDependencies,
  ...metadata.devDependencies
}));
const exactEntries = Object.keys(metadata.exports).filter(entry => !entry.includes('*'));
const publicEntries = new Set(exactEntries.map(entry =>
  entry === '.' ? metadata.name : metadata.name + entry.slice(1)
));

if (metadata.exports['./locale/*']) {
  // Allows specific locale modules from the public export pattern without requiring a build first.
  const locales = readdirSync(join(root, 'src/lib/locale'), { withFileTypes: true });
  for (const entry of locales) {
    if (entry.isFile() && /^[a-z]{2,3}_[A-Z]{2}\.ts$/.test(entry.name)) {
      const code = entry.name.slice(0, -3);
      publicEntries.add(`${metadata.name}/locale/${code}`);
    }
  }
}

// Visits only files where the harness declares JavaScript and Svelte imports.
function sourceFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      sources.push(...sourceFiles(file));
    }
    else if (/\.(?:ts|mjs|svelte)$/.test(entry.name)) {
      sources.push(file);
    }
  }
  return sources;
}

// Returns both component script blocks in check order, module first and instance second.
function componentScripts(source) {
  const component = parse(source, { modern: true });
  const blocks = [component.module, component.instance].filter(Boolean);
  return blocks.map(block => source.slice(block.content.start, block.content.end));
}

// Reads static imports and exports from the AST without evaluating the files.
function imports(file) {
  const source = readFileSync(file, 'utf8');
  const scripts = file.endsWith('.svelte') ? componentScripts(source) : [source];
  const dependencies = [];
  for (const script of scripts) {
    const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true);
    for (const node of ast.statements) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        dependencies.push(node.moduleSpecifier.text);
      }
    }
  }
  return dependencies;
}

describe('Package test import boundaries', () => {
  it('uses owned fixtures, public package entries and declared development dependencies', () => {
    const violations = [];
    for (const file of sourceFiles(testsRoot)) {
      for (const dependency of imports(file)) {
        let allowed;
        if (dependency.startsWith('.')) {
          const destination = resolve(dirname(file), dependency);
          const target = relative(testsRoot, destination);
          const localTestFile = target !== '..' && !target.startsWith('..' + sep) && !isAbsolute(target);
          const registryInput = file === registryReader && destination === registrySource;
          allowed = localTestFile || registryInput;
        }
        else if (dependency === metadata.name || dependency.startsWith(metadata.name + '/')) {
          allowed = publicEntries.has(dependency);
        }
        else {
          const packageName = dependency.startsWith('@')
            ? dependency.split('/').slice(0, 2).join('/')
            : dependency.split('/')[0];
          allowed = dependency.startsWith('node:') || dependencies.has(packageName);
        }
        if (!allowed) violations.push(`${relative(root, file)} imports ${dependency}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
