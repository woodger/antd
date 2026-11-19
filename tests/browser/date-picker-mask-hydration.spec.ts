import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import { samples } from './date-picker-mask-cases.mjs';
import { readMaskHydrationSourcePoint } from './date-picker-mask-hydration-reference.mjs';

let server: ViteDevServer;
let cache: string;
test.use({ locale: 'en-US', timezoneId: 'UTC', viewport: { width: 1440, height: 1000 } });
test.beforeAll(async () => {
  cache = await mkdtemp(join(fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'date-picker-mask-hydration-'));
  server = await createServer({ configFile: fileURLToPath(new URL(
    './vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

for (const sample of samples) for (const profile of ['string', 'object', 'mask'] as const) {
  test(`${sample.id} hydrates ${profile} format with retained defaults, caret and input nodes`, async ({ page }) => {
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      './fixtures/date-picker-mask-hydration.server.ts', import.meta.url)));
    const { head, body, domFree } = module.renderMaskHydration(sample.id, profile);

    expect(domFree).toBe(true);
    expect(body).toContain('id="mask-input"');
    await page.goto(`/date-picker-mask-hydration.html?owner=${sample.id}&profile=${profile}`);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
    }, { head, body });
    await page.addScriptTag({ type: 'module', url: '/date-picker-mask-hydration.client.ts' });
    await page.waitForFunction(() => window.maskHydrationContract);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve()))));
    const actual = await page.evaluate(() => window.maskHydrationContract!.read());

    expect(actual.sameOwner).toBe(true);
    expect(actual.sameRoot).toBe(true);
    expect(actual.sameInputs).toEqual(actual.parsed.map(() => true));
    expect(actual.fields).toEqual(actual.parsed);
    expect(actual.alive).toBe(true);
    expect(actual.callbacks).toBe(0);
    for (const variant of ['first', 'repeat'] as const) {
      const source = readMaskHydrationSourcePoint(sample.id, profile, 'settled', variant);
      expect(actual.fields).toEqual(source.inputs.map(input => ({
        value: input.value, defaultValue: input.defaultValue, valueAttribute: input.valueAttribute,
        caret: [input.selectionStart, input.selectionEnd, input.selectionDirection],
        focused: input.focused, connected: input.connected
      })));
    }
    if (sample.kind === 'range' && profile === 'string') {
      // The independently captured React hydration prefix retains the parsed
      // end caret when Enter moves focus there before any end-field pointer edit.
      await page.locator('#mask-input').click();
      await page.keyboard.press('Enter');
      await expect(page.locator('#mask-end')).toBeFocused();
      const focused = await page.evaluate(() => window.maskHydrationContract!.read());
      expect(focused.sameInputs).toEqual(actual.sameInputs);
      expect(focused.fields[1]).toEqual({ ...actual.parsed[1], focused: true });
    }
    const cleanup = await page.evaluate(() => window.maskHydrationContract!.dispose());

    expect(cleanup.inputCount).toBe(0);
    expect(cleanup.alive).toBe(false);
    expect(cleanup.fields.every(input => !input.connected)).toBe(true);
    await page.waitForTimeout(1000);
    const late = await page.evaluate(() => window.maskHydrationContract!.read());

    expect(late).toEqual(cleanup);
  });
}
