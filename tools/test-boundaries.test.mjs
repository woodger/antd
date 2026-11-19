// Проверяет границу тестового стенда по исходным импортам. Компоненты
// загружаются через публичный пакет, сценарии остаются в дереве tests.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const testsRoot = join(root, 'tests');
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dependencies = new Set(Object.keys({
  ...metadata.peerDependencies,
  ...metadata.devDependencies
}));
const publicEntries = new Set(Object.keys(metadata.exports).map(entry =>
  entry === '.' ? metadata.name : metadata.name + entry.slice(1)
));

// Обходит только файлы, в которых стенд объявляет импорты JavaScript и Svelte.
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

// Возвращает оба script-блока компонента в порядке проверки, module затем instance.
function componentScripts(source) {
  const component = parse(source, { modern: true });
  const blocks = [component.module, component.instance].filter(Boolean);
  return blocks.map(block => source.slice(block.content.start, block.content.end));
}

// Берёт статические import и export из AST, не вычисляя содержимое файлов.
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
          const target = relative(testsRoot, resolve(dirname(file), dependency));
          allowed = target !== '..' && !target.startsWith('..' + sep) && !isAbsolute(target);
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
