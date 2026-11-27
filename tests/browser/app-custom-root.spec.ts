import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import reference from './fixtures/ant-design-app-custom-root-reference.json' with { type: 'json' };
import { expect, test } from './test';

/** Opens client entry on top of an empty page of the same background. */
async function openFixture(page: Page, ssr = false) {
  const query = ssr ? 'app-custom&ssr' : 'app-custom';
  await page.goto(`/select-components-hydration.html?${query}`);
  await page.addScriptTag({ type: 'module', url: '/app-custom-root.client.ts' });
}

/** Reads the observable styles and the context of the two consumers. */
function readRoot(root: Locator, prefix: string) {
  return root.evaluate((node, prefix) => {
    const css = getComputedStyle(node);
    const childData = node.querySelector('#app-child')?.getAttribute('data-app-api');
    const childApi = childData && JSON.parse(childData).methods.join(',');
    return {
      tag: node.localName,
      classes: [prefix, prefix + '-rtl', 'context-app', 'local-app', 'root-class']
        .filter(name => node.classList.contains(name)),
      color: css.color,
      paddingTop: css.paddingTop,
      fontSize: css.fontSize,
      fontFamily: css.fontFamily,
      lineHeight: css.lineHeight,
      direction: css.direction,
      rootApi: node.dataset.rootApi,
      childApi,
      refMatches: document.getElementById('custom-app-ref')?.textContent === node.id
    };
  }, prefix);
}

test('App hydrates and updates a custom root before replacing it', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-app-custom-root-'));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/app-custom-root.server.ts', import.meta.url);
    const { renderCustomApp } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body } = renderCustomApp();
    await openFixture(page, true);
    const host = page.locator('#root');
    await expect(host).toHaveAttribute('data-hydration-ready', 'true');
    await host.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { head, body });
    const root = host.locator('#custom-root');
    const input = root.locator('#draft');
    const before = { root: await root.elementHandle(), input: await input.elementHandle() };
    await input.fill('before hydration');

    /** Checks the preservation of the investigated nodes and the state of input. */
    async function identity() {
      const sameRoot = await root.evaluate((node, prior) => node === prior, before.root);
      return input.evaluate((node: HTMLInputElement, { sameRoot, prior }) => ({
        sameRoot,
        sameInput: node === prior,
        focused: node === document.activeElement,
        draft: node.value
      }), { sameRoot, prior: before.input });
    }

    await host.dispatchEvent('hydrate-app');

    await expect(host).toHaveAttribute('data-hydrated', 'true');
    await expect.poll(() => readRoot(root, 'local-prefix-app')).toEqual(reference.data.initial);
    expect(await identity()).toEqual(reference.data.hydrated);
    await expect(root).toHaveAttribute('aria-label', 'Custom App');
    await expect(root).toHaveAttribute('data-root-owner', 'app');

    await page.getByRole('button', { name: 'Revise App' }).dispatchEvent('click');

    await expect.poll(() => readRoot(root, 'revised-app')).toEqual(reference.data.revised);
    expect(await identity()).toEqual(reference.data.updated);

    await page.getByRole('button', { name: 'Replace App root' }).dispatchEvent('click');

    await expect.poll(() => readRoot(root, 'revised-app')).toEqual(reference.data.replacement);
    expect(await identity()).toEqual(reference.data.replaced);
    await expect(root).not.toHaveAttribute('nativeelement');
    await expect(page.locator('#custom-app-ref')).toHaveText('none');
    await expect(page.locator('#custom-app-api')).toHaveText('true');
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test('App reattaches notice and modal holders after replacing its custom root', async ({ page }) => {
  await openFixture(page);
  const message = page.getByRole('button', { name: 'primary message' });
  const notification = page.getByRole('button', { name: 'primary notification' });
  const modal = page.getByRole('button', { name: 'primary modal' });
  const messages = page.locator('#app-notice-container .brand-message-notice');
  const notifications = page.locator('#app-notice-container .brand-notification-notice');
  const dialog = page.getByRole('dialog', { name: 'primary confirmation' });

  await message.click();
  await notification.click();
  await modal.click();
  await expect(messages).toHaveCount(1);
  await expect(notifications).toHaveCount(1);
  await expect(dialog).toBeVisible();

  await page.getByRole('button', { name: 'Replace App root', includeHidden: true })
    .dispatchEvent('click');

  await expect(dialog).toHaveCount(0);
  await expect(messages).toHaveCount(0);
  await expect(notifications).toHaveCount(0);
  await expect(page.locator('#custom-app-api')).toHaveText('true');
  await message.click();
  await notification.click();
  await modal.click();

  await expect(dialog).toBeVisible();
  await expect(messages).toHaveCount(1);
  await expect(notifications).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(modal).toBeFocused();
});
