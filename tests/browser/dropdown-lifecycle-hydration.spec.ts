import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

for (const startOpen of [false, true]) {
  test(`hydrates forceRender with initial open=${startOpen} and preserves the editor on close`, async ({
    page
  }) => {
    const artifacts = new URL('../../.upstream/artifacts/dropdown-lifecycle-hydration-', import.meta.url);
    const cache = await mkdtemp(fileURLToPath(artifacts));
    let server: ViteDevServer | undefined;
    try {
      server = await createServer({
        configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
        server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
        appType: 'custom', cacheDir: cache
      });
      const fixture = new URL('./fixtures/dropdown-lifecycle-hydration.server.ts', import.meta.url);
      const { renderDropdownLifecycle } = await server.ssrLoadModule(fileURLToPath(fixture));
      const { head, body } = renderDropdownLifecycle(startOpen);
      expect(body).not.toContain('id="draft"');
      expect(body).not.toContain('popover="manual"');

      await page.goto('/dropdown-menu-hydration.html' + (startOpen ? '?open' : ''));
      await page.evaluate(({ head, body }) => {
        const root = document.getElementById('root');
        if (!root) throw new Error('Missing Dropdown lifecycle hydration root');

        document.head.insertAdjacentHTML('beforeend', head);
        root.innerHTML = body;
      }, { head, body });
      const outside = page.locator('body > #outside');
      await outside.focus();
      await page.addScriptTag({ type: 'module', url: '/dropdown-lifecycle-hydration.client.ts' });
      await page.waitForFunction(() => window.dropdownLifecycleHydration);

      expect(await page.evaluate(() => window.dropdownLifecycleHydration?.reusedTrigger)).toBe(true);
      await expect(outside).toBeFocused();
      const trigger = page.locator('#trigger');
      const draft = page.locator('#draft');
      await expect(draft).toHaveCount(1);
      await expect(trigger).toHaveAttribute('aria-expanded', String(startOpen));
      if (!startOpen) {
        await expect(draft).toBeHidden();
        await trigger.click();
      }
      const original = await draft.elementHandle();
      await draft.fill('Hydrated draft');

      await trigger.click();
      await expect(draft).toBeHidden();
      await trigger.click();

      await expect(draft).toBeVisible();
      await expect(draft).toHaveValue('Hydrated draft');
      expect(await draft.evaluate((node, previous) => node === previous, original)).toBe(true);
      await page.evaluate(() => window.dropdownLifecycleHydration?.dispose());
      await expect(page.locator('[popover]')).toHaveCount(0);
    }
    finally {
      await server?.close();
      await rm(cache, { recursive: true });
    }
  });
}
