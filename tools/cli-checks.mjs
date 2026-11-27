// Checks the built package with the project's installed tools.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readJson } from './ant-design-common.mjs';

const checks = {
  types: ['svelte-check', 'svelte-check', ['--tsconfig', './tests/tsconfig.json']],
  package: ['vitest', 'vitest', ['run', '--config', 'tests/package/vite.config.ts']],
  browser: ['@playwright/test', 'playwright', ['test']]
};

// Resolves the installed dependency's bin and runs it with the current Node.
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

// Builds first for checks that read dist. Playwright's webServer handles its build.
export async function runCheck(kind, args, { root }) {
  if (kind !== 'browser') {
    await runTool('@sveltejs/package', 'svelte-package', [], root);
  }

  const [dependency, command, baseArgs] = checks[kind];
  await runTool(dependency, command, [...baseArgs, ...args], root);
}
