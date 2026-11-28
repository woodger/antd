import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-watch-observation.json' with { type: 'json' };

test('Form watch hydrates its initial selection in place and then tracks the field', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-watch-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixturePath = fileURLToPath(new URL(
      '../fixtures/form-watch-hydration.server.ts', import.meta.url
    ));
    const { renderWatchForm } = await server.ssrLoadModule(fixturePath);
    const { head, body } = renderWatchForm();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const target = document.getElementById('root');
      if (!target) {
        throw new Error('The hydration host is missing');
      }
      target.innerHTML = body;
    }, { head, body });

    const output = page.locator('[data-watch="outer"]');
    const read = async () => JSON.parse((await output.textContent()) ?? '');
    const input = page.locator('#title-A');
    await input.focus();
    expect(await read()).toEqual(observation.ssr.outer);

    await page.addScriptTag({ type: 'module', url: '/form-watch-hydration.client.ts' });
    await page.waitForFunction(() => window.formWatchHydration !== undefined);

    await expect(input).toBeFocused();
    expect(await input.evaluate(node => window.formWatchHydration?.input === node)).toBe(true);
    await expect.poll(read).toEqual(observation.cases.initial.outer);
    await input.fill('typed');
    await expect.poll(read).toEqual(observation.cases.userEdit.outer);
    await page.evaluate(() => window.formWatchHydration?.dispose());
    await expect(page.locator('#form-watch-fixture')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
