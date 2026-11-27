import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

for (const family of ['Tooltip', 'Popover'] as const) {
  test(`Tooltip.UniqueProvider hydrates a default-open ${family} and preserves trigger focus`,
  async ({ page }) => {
    const cache = new URL('../../../.upstream/artifacts/tooltip-unique-hydration-', import.meta.url);
    const cacheDir = await mkdtemp(fileURLToPath(cache));
    let server: ViteDevServer | undefined;
    try {
      server = await createServer({
        configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
        server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
        appType: 'custom',
        cacheDir
      });
      const entry = new URL('../fixtures/tooltip-unique-hydration.server.ts', import.meta.url);
      const { renderTooltipUnique } = await server.ssrLoadModule(fileURLToPath(entry));
      const delegates = family === 'Popover';
      const { body, head } = renderTooltipUnique(delegates);
      const query = delegates ? 'tooltip-unique&delegates' : 'tooltip-unique';
      await page.goto(`/select-components-hydration.html?${query}`);
      await page.addScriptTag({ type: 'module', url: '/tooltip-unique-hydration.client.ts' });
      const root = page.locator('#root');
      await expect(root).toHaveAttribute('data-hydration-ready', 'true');
      await root.evaluate((target, markup) => {
        document.head.insertAdjacentHTML('beforeend', markup.head);
        target.innerHTML = markup.body;
      }, { body, head });
      const trigger = root.getByRole('button', { name: 'Trigger a', exact: true });
      const original = await trigger.elementHandle();
      await trigger.focus();
      const shell = page.locator('[data-ant-tooltip-unique]');
      await expect(shell).toHaveCount(0);

      await root.dispatchEvent('hydrate-tooltip-unique');

      await expect(root).toHaveAttribute('data-hydrated', 'true');
      await expect(trigger).toBeFocused();
      const link = delegates ? 'aria-controls' : 'aria-describedby';
      await expect(trigger).toHaveAttribute(link, 'external-id-a');
      expect(await trigger.evaluate((node, before) => node === before, original)).toBe(true);
      await expect(shell).toBeVisible();
      await expect(shell).toContainText('Payload a');
      if (delegates) await expect(shell).toHaveAccessibleName('Dialog a');

      await page.keyboard.press('Escape');

      await expect(shell).toBeHidden();
      await expect(trigger).toBeFocused();
    }
    finally {
      await server?.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
}
