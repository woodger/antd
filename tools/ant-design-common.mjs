// Локальные пути и файловые операции CLI. Запись через временный файл оставляет
// предыдущий артефакт доступным до успешного переименования.
import { readFile, writeFile, rename, mkdir, rm } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const registryFile = 'docs/reference/ant-design-porting/registry.json';
export const reportFile = 'docs/reference/ant-design-porting/status.md';

// Разрешает относительный путь внутри корня проекта до обращения к файлам.
export function projectPath(root, path) {
  if (typeof path !== 'string'
    || !path
    || isAbsolute(path)
    || path.includes('\\')
    || path.split('/').includes('..')) {
    throw new Error(`Invalid project path: ${path}`);
  }

  const target = resolve(root, path);
  const relativePath = relative(root, target);
  if (relativePath.startsWith('..')) {
    throw new Error(`Path outside project: ${path}`);
  }

  return target;
}

// Уточняет путь в диагностике независимо от того, не удались чтение или разбор.
export async function readJson(path) {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  }
  catch (error) {
    throw new Error(`Cannot read JSON ${path}: ${error.message}`);
  }
}

// Создаёт родительский каталог и удаляет временный файл при ошибке записи или rename.
export async function writeAtomic(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;

  try {
    await writeFile(temporary, content);
    await rename(temporary, path);
  }
  catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

// Переводит отказ команды в stderr и ненулевой exit code без принудительного выхода.
export function runCli(main) {
  return main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
