// Проверяет реестр относительно его схемы, экспортов пакета и локального
// upstream checkout. Не выполняет тесты, на которые ссылаются записи реестра.
import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { projectPath, readJson, registryFile } from './ant-design-common.mjs';

export const featureStates = ['unreviewed', 'missing', 'partial', 'supported'];
export const integrationPrefix = 'integration:';
const scopes = ['target', 'candidate', 'excluded'];
// Отсутствие доступа трактуется как отсутствие проверяемого пути.
const exists = path => access(path).then(() => true, () => false);

// Читает имена экспортов значений из barrel без загрузки компонентов.
export function publicExports(source) {
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  const exports = new Map();
  for (const node of ast.statements) {
    if (!ts.isExportDeclaration(node)
      || node.isTypeOnly
      || !node.exportClause
      || !ts.isNamedExports(node.exportClause)) {
      continue;
    }
    for (const item of node.exportClause.elements) {
      if (!item.isTypeOnly)
        exports.set(item.name.text, node.moduleSpecifier?.text ?? null);
    }
  }
  return exports;
}

// Считает именованные реэкспорты default только из модулей компонентов.
export function componentExportNames(source) {
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  const names = [];
  for (const node of ast.statements) {
    if (!ts.isExportDeclaration(node) || node.isTypeOnly) {
      continue;
    }

    const moduleName = node.moduleSpecifier?.text ?? '';
    const clause = node.exportClause;
    if (!/\.(svelte|component)(\.js)?$/.test(moduleName) || !clause || !ts.isNamedExports(clause)) {
      continue;
    }

    for (const item of clause.elements) {
      if (!item.isTypeOnly && item.propertyName?.text === 'default') {
        names.push(item.name.text);
      }
    }
  }
  return names;
}

// Накапливает нарушения схемы в порядке обхода. Межзаписочные проверки идут
// после проверки записей, когда уже известны идентификаторы и экспорты.
export function validateRegistry(data) {
  const errors = [];
  // Позволяет вернуть все нарушения текущего раздела одним списком.
  const require = (condition, message) => {
    if (!condition)
      errors.push(message);
  };
  require(data?.schemaVersion === 2, 'schemaVersion must be 2');
  require(
    typeof data?.upstream?.version === 'string' && /^\d+\.\d+\.\d+$/.test(data.upstream.version),
    'Invalid upstream version'
  );
  require(/^[a-f0-9]{40}$/.test(data?.upstream?.revision ?? ''), 'Invalid upstream revision');
  require(/^[a-f0-9]{64}$/.test(data?.upstream?.archiveSha256 ?? ''), 'Invalid archive SHA-256');
  const archiveUrl = data?.upstream?.archiveUrl;
  const officialUrl = `https://registry.npmjs.org/antd/-/antd-${data?.upstream?.version}.tgz`;
  require(archiveUrl === officialUrl, 'Archive URL must identify the pinned official antd package');
  require(Array.isArray(data?.components), 'components must be an array');
  require(Array.isArray(data?.supportingExports), 'supportingExports must be an array');
  if (errors.length) {
    return errors;
  }

  require(
    data.supportingExports.every(name => typeof name === 'string' && name.length > 0),
    'supportingExports must contain nonempty strings'
  );
  require(
    new Set(data.supportingExports).size === data.supportingExports.length,
    'Duplicate supporting export'
  );
  const ids = new Set();
  const localNames = new Set(data.supportingExports);

  // Проверяет одну запись, пополняя множества имён для поиска дубликатов.
  function validateComponent(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push('Component must be an object');
      return;
    }
    const label = item?.id ?? '<missing id>';
    require(
      typeof item?.id === 'string' && /^[a-z][a-z0-9-]*$/.test(item.id),
      `Invalid component id: ${label}`
    );
    require(!ids.has(item.id), `Duplicate component id: ${label}`);
    ids.add(item.id);
    require(typeof item.name === 'string' && item.name.length > 0, `${label}: missing name`);
    require(
      typeof item.category === 'string' && item.category.length > 0,
      `${label}: missing category`
    );
    require(scopes.includes(item.scope), `${label}: invalid scope`);
    require(
      typeof item.scopeReason === 'string' && item.scopeReason.length > 0,
      `${label}: missing scope reason`
    );
    require(
      item.reviewedRevision === null || /^[a-f0-9]{40}$/.test(item.reviewedRevision),
      `${label}: invalid reviewed revision`
    );
    require(['S', 'M', 'L', 'unknown'].includes(item.effort), `${label}: invalid effort`);
    require(
      ['p1', 'p2', 'p3', 'unassigned'].includes(item.priority),
      `${label}: invalid priority`
    );
    for (const field of ['exports', 'dependencies', 'features', 'evidence', 'upstreamPackages'])
      require(Array.isArray(item[field]), `${label}: ${field} must be an array`);
    for (const field of ['dependencies', 'evidence'])
      if (Array.isArray(item[field]))
        require(
          item[field].every(value => typeof value === 'string' && value.length > 0),
          `${label}: ${field} must contain nonempty strings`
        );
    if (Array.isArray(item.upstreamPackages))
      for (const dependency of item.upstreamPackages)
        require(
          typeof dependency?.name === 'string'
          && typeof dependency.range === 'string'
          && (dependency.referenceVersion === null
            || /^\d+\.\d+\.\d+(?:[-+].+)?$/.test(
              dependency.referenceVersion
            )),
          `${label}: invalid upstream package reference`
        );
    try {
      projectPath('/project', item.upstreamPath);
    }
    catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
    if (!Array.isArray(item.exports) || !Array.isArray(item.features)) {
      return;
    }

    for (const entry of item.exports) {
      require(
        typeof entry?.upstream === 'string' && Array.isArray(entry.local) && entry.local.length > 0,
        `${label}: invalid export mapping`
      );
      if (!Array.isArray(entry?.local))
        continue;
      for (const name of entry.local) {
        require(
          typeof name === 'string' && !localNames.has(name),
          `${label}: duplicate or invalid local export ${name}`
        );
        localNames.add(name);
      }
    }
    const featureIds = new Set();
    for (const feature of item.features) {
      if (!feature || typeof feature !== 'object' || Array.isArray(feature)) {
        errors.push(`${label}: invalid feature`);
        continue;
      }
      require(
        typeof feature?.id === 'string' && feature.id.length > 0 && !featureIds.has(feature.id),
        `${label}: duplicate or invalid feature id`
      );
      featureIds.add(feature.id);
      require(
        typeof feature.title === 'string' && feature.title.length > 0,
        `${label}: missing feature title`
      );
      require(
        featureStates.includes(feature.state),
        `${label}/${feature.id}: invalid feature state`
      );
      require(
        typeof feature.requiredForV1 === 'boolean',
        `${label}/${feature.id}: requiredForV1 must be boolean`
      );
      require(
        Array.isArray(feature.evidence),
        `${label}/${feature.id}: evidence must be an array`
      );
      if (Array.isArray(feature.evidence))
        require(
          feature.evidence.every(value => typeof value === 'string' && value.length > 0),
          `${label}/${feature.id}: evidence must contain nonempty strings`
        );
      require(typeof feature.note === 'string', `${label}/${feature.id}: missing note`);
      if (feature.state === 'supported')
        require(
          item.exports.length > 0 && feature.evidence?.length > 0 && item.reviewedRevision !== null,
          `${label}/${feature.id}: supported requires exports, review revision and evidence`
        );
    }
    require(
      item.features.some(feature => feature?.requiredForV1),
      `${label}: missing v1 criteria`
    );
  }
  for (const item of data.components) {
    validateComponent(item);
  }

  for (const item of data.components) {
    if (!Array.isArray(item?.dependencies)) {
      continue;
    }
    for (const dependency of item.dependencies) {
      require(ids.has(dependency) && dependency !== item.id, `${item.id}: invalid dependency ${dependency}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  // Сохраняет текущий путь рекурсии отдельно от уже проверенных записей.
  function visit(componentId) {
    if (visiting.has(componentId)) {
      errors.push(`Dependency cycle: ${componentId}`);
      return;
    }
    if (visited.has(componentId)) {
      return;
    }

    visiting.add(componentId);
    const record = data.components.find(item => item?.id === componentId);
    const dependencies = record?.dependencies;
    for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
      if (ids.has(dependency)) {
        visit(dependency);
      }
    }

    visiting.delete(componentId);
    visited.add(componentId);
  }
  for (const id of ids)
    visit(id);
  return errors;
}

// Оценивает обязательный для v1 объём на конкретной ревизии upstream.
export function coverage(item, revision) {
  if (!item.exports.length) {
    return 'not-started';
  }
  const required = item.features.filter(feature => feature.requiredForV1);
  if (item.reviewedRevision !== revision
    || required.some(feature => feature.state === 'unreviewed')) {
    return 'needs-review';
  }
  return required.every(feature => feature.state === 'supported') ? 'v1-ready' : 'partial';
}

// Сверяет метаданные с локальными файлами. При отсутствии checkout доступны
// локальные проверки, если вызывающий код не потребовал upstream явно.
export async function inspectRegistry(root, { requireUpstream = false } = {}) {
  const data = await readJson(projectPath(root, registryFile));
  const errors = validateRegistry(data);
  if (errors.length) {
    return { data, errors, upstream: 'not checked' };
  }
  const index = await readFile(projectPath(root, 'src/lib/index.ts'), 'utf8');
  const exports = publicExports(index);
  const registered = new Set(
    [
      ...data.supportingExports,
      ...data.components.flatMap(item => item.exports.flatMap(entry => entry.local))
    ]
  );
  for (const name of registered)
    if (!exports.has(name))
      errors.push(`Missing local export: ${name}`);
  for (const name of exports.keys())
    if (!registered.has(name))
      errors.push(`Unregistered local export: ${name}`);
  for (const [name, source] of exports) {
    if (!source?.startsWith('./')) {
      errors.push(`Export source must be local: ${name}`);
      continue;
    }
    const base = `src/lib/${source.slice(2)}`;
    const candidates = ['', '.ts', '.svelte.ts', '/index.ts'].map(suffix => base + suffix);
    if (base.endsWith('.js'))
      candidates.push(base.slice(0, -3) + '.ts');
    const present = await Promise.all(candidates.map(path => exists(projectPath(root, path))));
    if (!present.some(Boolean)) {
      errors.push(`Missing source for export: ${name}`);
    }
  }
  const integrationEvidence = new Set();
  const upstreamRoot = projectPath(root, '.upstream/ant-design');
  let upstream = 'absent (offline local checks only)';
  if (await exists(upstreamRoot)) {
    try {
      const revision = execFileSync(
        'git',
        ['-C', upstreamRoot, 'rev-parse', 'HEAD'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      ).trim();
      upstream = revision;
      if (revision !== data.upstream.revision)
        errors.push(`Upstream revision mismatch: ${revision}`);
      const upstreamPackage = await readJson(projectPath(upstreamRoot, 'package.json'));
      if (upstreamPackage.name !== 'antd' || upstreamPackage.version !== data.upstream.version)
        errors.push('Upstream package version does not match the registry');
      if (requireUpstream
        && execFileSync(
          'git',
          ['-C', upstreamRoot, 'status', '--porcelain'],
          { encoding: 'utf8' }
        ).trim()) {
        errors.push('Upstream checkout has local modifications');
      }
    }
    catch {
      errors.push('Cannot verify upstream Git revision');
    }
  }
  else if (requireUpstream)
    errors.push('Pinned upstream checkout is required but absent');
  for (const item of data.components) {
    const refs = [...item.evidence, ...item.features.flatMap(feature => feature.evidence)];
    for (const ref of new Set(refs)) {
      if (ref.startsWith(integrationPrefix)) {
        const key = ref.slice(integrationPrefix.length);
        const [componentId, featureId, extra] = key.split('/');
        if (componentId !== item.id
          || extra !== undefined
          || (featureId !== undefined
            && !item.features.some(
              feature => feature.id === featureId
            ))) {
          errors.push(`${item.id}: invalid integration evidence ${ref}`);
        }
        else {
          integrationEvidence.add(key);
        }
        continue;
      }
      try {
        if (!await exists(projectPath(root, ref.split('#')[0])))
          errors.push(`${item.id}: missing evidence ${ref}`);
      }
      catch (error) {
        errors.push(`${item.id}: ${error.message}`);
      }
    }
    if (upstream !== 'absent (offline local checks only)') {
      try {
        if (!await exists(projectPath(upstreamRoot, item.upstreamPath)))
          errors.push(`${item.id}: missing upstream path`);
      }
      catch (error) {
        errors.push(error.message);
      }
    }
  }
  return {
    data,
    errors,
    upstream,
    componentExports: componentExportNames(index).length,
    integrationEvidence: [...integrationEvidence]
  };
}

const states = {
  'not-started': 'Нет публичной реализации',
  'needs-review': 'Требуется аудит v1',
  'v1-ready': 'Согласованный v1 покрыт',
  partial: 'Частично покрыт v1'
};
// Экранирует разделитель таблицы и сохраняет строку отчёта однострочной.
const escape = text => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');

// Собирает строку таблицы из публичных экспортов, покрытия и оставшихся пробелов.
function renderComponentRow(item, revision) {
  const source = `https://github.com/ant-design/ant-design/tree/${revision}/${item.upstreamPath}`;
  const gaps = item.features.filter(feature => feature.state !== 'supported')
    .map(feature => `${feature.title} (${feature.state})`)
    .join('; ');
  const name = escape(item.name);
  const category = escape(item.category);
  const scope = item.scope;
  const names = item.exports.flatMap(entry => entry.local).join(', ') || '—';
  const status = states[coverage(item, revision)];
  const remaining = escape(gaps);

  return `| [${name}](${source}) | ${category} | ${scope} | ${names} | ${status} | ${remaining} |`;
}

// Формирует детерминированный Markdown из состояния реестра и числа компонентов.
export function renderReport(data, componentExports) {
  const counts = Object.fromEntries(
    Object.keys(states).map(
      state => [
        state,
        data.components.filter(item => coverage(item, data.upstream.revision) === state).length
      ]
    )
  );
  const familyCount = data.components.length;
  const implementedCount = data.components.length - counts['not-started'];
  const lines = [
    '# Покрытие переноса Ant Design',
    '',
    '> Type: Reference. Сгенерировано командой `npm run cli -- registry report`.',
    '> Изменяйте registry.json; результаты запуска тестов здесь не хранятся.',
    '> Ссылки integration: проверяются потребителем npm-пакета; локальная проверка их не подтверждает.',
    '',
    `Эталон: Ant Design ${data.upstream.version}, commit \`${data.upstream.revision}\`.`,
    '',
    `Каталог: **${familyCount} семейств**, публичных Svelte-компонентов: **${componentExports}**.`,
    `Есть публичная реализация у **${implementedCount}** семейств; отсутствует у **${counts['not-started']}**.`,
    `Проверенный объём v1 покрыт у **${counts['v1-ready']}**; требуется аудит у **${counts['needs-review']}**; частично покрыт у **${counts.partial}**.`,
    '',
    'Наличие экспорта, полнота согласованного v1 и результаты тестов учитываются отдельно.',
    'Candidate означает запись каталога, для которой целевой объём ещё не согласован.',
    '',
    '| Семейство | Категория | Scope | Экспорты Svelte | Аудит v1 | Известные пробелы |',
    '| --- | --- | --- | --- | --- | --- |'
  ];
  for (const item of data.components) {
    lines.push(renderComponentRow(item, data.upstream.revision));
  }
  return `${lines.join('\n')}\n`;
}
