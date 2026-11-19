// Извлекает CSS из закреплённого архива Ant Design. Сначала проверяет все
// выбранные рецепты, затем печатает, сравнивает или записывает результаты.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectPath, readJson, writeAtomic, registryFile } from './ant-design-common.mjs';
import { verifyArchive, archiveEntry, extractCss } from './ant-design-css-core.mjs';

// Только отсутствие локального архива допускает загрузку. Другие ошибки сохраняются.
function readLocalArchive(path) {
  return readFile(path).catch(error => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });
}

// Готовит результат одного рецепта, проверяя путь и признаки закреплённого архива.
function prepareCssOutput(css, recipe, upstream, root) {
  const extension = recipe.format === 'module' ? '.css.js' : '.css';
  if (!recipe.output.startsWith('src/lib/vendor/') || !recipe.output.endsWith(extension)) {
    throw new Error('CSS output must stay in the component vendor directory');
  }

  if (!recipe.header.includes(`Ant Design ${upstream.version}`)
    || !recipe.header.includes(upstream.archiveSha256)) {
    throw new Error(`Recipe provenance is stale: ${recipe.id}`);
  }

  const result = extractCss(css, recipe);
  const output = projectPath(root, recipe.output);
  return { recipe, result, output };
}

// Описывает проверенный CSS отдельно от stdout, где может находиться сам CSS.
function writeCssStatus(stderr, recipe, result, check, write) {
  const ruleCount = result.rules;
  const keyframeCount = result.keyframes.length;
  const status = write ? '; written' : check ? '; matches' : '; preview only';
  stderr.write(`${recipe.id}: ${ruleCount} rules, ${keyframeCount} keyframes; SHA-256 verified${status}\n`);
}

// Проверяет параметры до чтения архива, сохраняя режим --list без доступа к нему.
export async function runCss(
  { recipe: id, list, check, write, fetch: allowFetch, archive: supplied },
  { root, stdout, stderr, fetch: fetchArchive }
) {
  const recipesPath = projectPath(root, 'tools/ant-design-css-recipes.json');
  const recipes = await readJson(recipesPath);
  if (list) {
    stdout.write(`${recipes.map(item => item.id).join('\n')}\n`);
    return;
  }

  const selected = id === 'all' ? recipes : recipes.filter(item => item.id === id);
  if (!selected.length) {
    throw new Error(`Unknown CSS recipe: ${id}`);
  }
  if (check && write) {
    throw new Error('Choose --check or --write');
  }

  const registryPath = projectPath(root, registryFile);
  const { upstream } = await readJson(registryPath);
  const archiveUrl = upstream.archiveUrl;
  const officialUrl = `https://registry.npmjs.org/antd/-/antd-${upstream.version}.tgz`;
  if (archiveUrl !== officialUrl) {
    throw new Error('CSS source must be the pinned official archive');
  }

  const path = supplied
    ? resolve(root, supplied)
    : projectPath(root, `.upstream/artifacts/antd-${upstream.version}.tgz`);
  let bytes = await readLocalArchive(path);
  if (!bytes) {
    if (!allowFetch || supplied) {
      throw new Error(`Missing archive ${path}. Use --fetch or --archive=path`);
    }

    const response = await fetchArchive(upstream.archiveUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      throw new Error(`Archive download failed: HTTP ${response.status}`);
    }

    bytes = Buffer.from(await response.arrayBuffer());
    verifyArchive(bytes, upstream.archiveSha256);
    await writeAtomic(path, bytes);
  }

  verifyArchive(bytes, upstream.archiveSha256);
  const stylesheet = archiveEntry(bytes, 'package/dist/antd.css');
  const css = stylesheet.toString('utf8');

  const outputs = selected.map(recipe => prepareCssOutput(css, recipe, upstream, root));
  for (const { recipe, result, output } of outputs) {
    if (write) {
      await writeAtomic(output, result.content);
    }
    else if (check) {
      const actual = await readFile(output, 'utf8');
      if (actual !== result.content) {
        throw new Error(`CSS differs: ${recipe.output}. Review the recipe before --write`);
      }
    }
    else {
      stdout.write(id === 'all' ? result.stylesheet : result.content);
    }
    writeCssStatus(stderr, recipe, result, check, write);
  }
}
