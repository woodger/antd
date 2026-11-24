import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

for (const startOpen of [false, true]) {
  test(`hydrates Dropdown trigger classes and ref with initial open=${startOpen}`, async ({ page }) => {
    const artifacts = new URL('../../.upstream/artifacts/dropdown-appearance-hydration-', import.meta.url);
    const cache = await mkdtemp(fileURLToPath(artifacts));
    let server: ViteDevServer | undefined;
    try {
      server = await createServer({
        configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
        server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
        appType: 'custom', cacheDir: cache
      });
      const url = new URL('./fixtures/dropdown-appearance-hydration.server.ts', import.meta.url);
      const { renderDropdownAppearance } = await server.ssrLoadModule(fileURLToPath(url));
      const { head, body } = renderDropdownAppearance(startOpen);
      await page.goto('/dropdown-menu-hydration.html' + (startOpen ? '?open' : ''));
      await page.evaluate(({ head, body }) => {
        const target = document.getElementById('root');
        if (!target) throw new Error('Missing Dropdown appearance hydration target');

        document.head.insertAdjacentHTML('beforeend', head);
        target.innerHTML = body;
      }, { head, body });
      const outside = page.locator('body > #outside');
      const trigger = page.locator('#trigger');
      const popup = page.locator('[data-ant-dropdown-popup]');
      const originalTrigger = await trigger.elementHandle();
      const originalPopup = await popup.elementHandle();
      await expect(trigger).toHaveClass('owned');
      await outside.focus();

      await page.addScriptTag({ type: 'module', url: '/dropdown-appearance-hydration.client.ts' });
      await page.waitForFunction(() => Boolean(window.disposeDropdownAppearance));

      await expect(outside).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', String(startOpen));
      await expect(page.locator('#trigger-reference')).toHaveAttribute('data-alias', 'true');
      expect(await trigger.evaluate((node, prior) => node === prior, originalTrigger)).toBe(true);
      expect(await popup.evaluate((node, prior) => node === prior, originalPopup)).toBe(true);
      await expect(popup).toHaveClass(/\bshared\b/);
      if (startOpen) {
        await expect(popup).toBeVisible();
        await expect(trigger).toHaveClass(/\bmine\b/);
        await trigger.click();
      }
      await expect(popup).toBeHidden();
      await expect(trigger).not.toHaveClass(/\bmine\b/);

      await trigger.click();

      await expect(popup).toBeVisible();
      await expect(trigger).toHaveClass(/\bmine\b/);
      await page.evaluate(() => window.disposeDropdownAppearance?.());
      await expect(popup).toHaveCount(0);
      await expect(trigger).toHaveCount(0);
      expect(await originalTrigger.getAttribute('class')).toBe('owned');
    }
    finally {
      await server?.close();
      await rm(cache, { recursive: true });
    }
  });
}
