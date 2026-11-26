// Запускает проверки собранного пакета локальными инструментами проекта.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readJson } from './ant-design-common.mjs';

const checks = {
  types: ['svelte-check', 'svelte-check', ['--tsconfig', './tests/tsconfig.json']],
  package: ['vitest', 'vitest', ['run', '--config', 'tests/package/vite.config.ts']],
  browser: ['@playwright/test', 'playwright', ['test']]
};

// Разрешает bin установленной зависимости и запускает его через текущий Node.
async function runTool(dependency, command, args, root) {
  const manifestURL = import.meta.resolve(dependency + '/package.json');
  const { bin } = await readJson(new URL(manifestURL));
  const entry = typeof bin === 'string' ? bin : bin?.[command];
  if (!entry) {
    throw new Error(`Missing executable ${command} in ${dependency}`);
  }

  const script = fileURLToPath(new URL(entry, manifestURL));
  execFileSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
}

// Сначала собирает пакет для проверок, читающих dist. В Playwright сборкой владеет webServer.
export async function runCheck(kind, args, { root }) {
  if (kind !== 'browser') {
    await runTool('@sveltejs/package', 'svelte-package', [], root);
  }

  const [dependency, command, baseArgs] = checks[kind];
  await runTool(dependency, command, [...baseArgs, ...args], root);
}
