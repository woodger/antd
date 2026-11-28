import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-events-observation.json' with { type: 'json' };

test('FormProvider hydrates without changing the editor and observes its first edit', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-events-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixturePath = fileURLToPath(new URL(
      '../fixtures/form-events-hydration.server.ts', import.meta.url
    ));
    const { renderFormEvents } = await server.ssrLoadModule(fixturePath);
    const { head, body } = renderFormEvents();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const target = document.getElementById('root');
      if (!target) {
        throw new Error('The hydration host is missing');
      }
      target.innerHTML = body;
    }, { head, body });
    const input = page.locator('#alpha-plain');
    await input.focus();

    await page.addScriptTag({ type: 'module', url: '/form-events-hydration.client.ts' });
    await page.waitForFunction(() => window.formEventsHydration !== undefined);

    await expect(input).toBeFocused();
    expect(await input.evaluate(node => window.formEventsHydration?.input === node)).toBe(true);
    await expect(page.locator('#form-events')).toHaveText('[]');
    await input.fill('alpha plain');

    const events = await page.locator('#form-events').textContent();
    const trace: unknown[][] = JSON.parse(events ?? '');
    expect(trace.slice(0, 3)).toEqual(observation.stages.ordinaryChange.slice(0, 3));
    await page.evaluate(() => window.formEventsHydration?.dispose());
    await expect(page.locator('form')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
