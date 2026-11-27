// Local paths and file operations for the CLI. Writing to a temporary file keeps the previous
// artifact available until rename succeeds.
import { readFile, writeFile, rename, mkdir, rm } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const registryFile = 'docs/reference/ant-design-porting/registry.json';
export const reportFile = 'docs/reference/ant-design-porting/status.md';

// Resolves a relative path within the project root before accessing files.
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

// Includes the path in diagnostics for both read and parse failures.
export async function readJson(path) {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  }
  catch (error) {
    throw new Error(`Cannot read JSON ${path}: ${error.message}`);
  }
}

// Creates the parent directory and removes the temporary file if writing or renaming fails.
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

// Reports a command failure to stderr and sets a nonzero exit code without forcing an exit.
export function runCli(main) {
  return main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
