import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import reference from '../fixtures/ant-design-button-hydration-reference.json' with { type: 'json' };
import { expect, test } from '../test';

for (const { profile, activations, ...focus } of reference.cases) {
  test(`Button preserves pre-hydration focus and keyboard activation for ${profile}`,
  async ({ page }) => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'antd-button-hydration-'));
    let server: ViteDevServer | undefined;
    try {
      server = await createServer({
        configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
        server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
        appType: 'custom',
        cacheDir
      });
      const entry = new URL('../fixtures/button-hydration.server.ts', import.meta.url);
      const { renderButton } = await server.ssrLoadModule(fileURLToPath(entry));
      const { head, body } = renderButton(profile);
      await page.goto(`/select-components-hydration.html?button=${profile}`);
      await page.addScriptTag({ type: 'module', url: '/button-hydration.client.ts' });
      const root = page.locator('#root');
      await expect(root).toHaveAttribute('data-hydration-ready', 'true');
      await root.evaluate((target, markup) => {
        document.head.insertAdjacentHTML('beforeend', markup.head);
        target.innerHTML = markup.body;
      }, { head, body });
      const role = profile === 'link' ? 'link' : 'button';
      const action = root.getByRole(role, { name: 'Hydrated action', exact: true });
      await action.focus();
      await expect(action).toBeFocused();
      const original = await action.elementHandle();
      const focusEvents = await action.evaluateHandle(node => {
        const events: string[] = [];
        node.addEventListener('focusin', event => events.push(event.type));
        node.addEventListener('focusout', event => events.push(event.type));
        return events;
      });

      await root.dispatchEvent('hydrate-button');

      await expect(root).toHaveAttribute('data-hydrated', 'true');
      const state = await action.evaluate((node, before) => ({
        sameNode: node === before,
        focused: node === document.activeElement
      }), original);
      expect({ ...state, focusEvents: await focusEvents.jsonValue() }).toEqual(focus);

      await page.keyboard.press('Enter');

      await expect(root.locator('#activations')).toHaveText(JSON.stringify(activations));
    }
    finally {
      await server?.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
}
