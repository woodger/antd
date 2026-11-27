import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import type { Page } from '@playwright/test';
import reference from '../fixtures/ant-design-config-provider-csp-reference.json' with { type: 'json' };
import { expect, test } from '../test';

const [firstNonce, nextNonce] = reference.nonces;
const scopedStyles = 'style[data-ant-svelte-theme]';
const strictScopes = reference.strict.map(sample => sample.scope);

/** Reads DOM nonce and CSSOM of each specific button. */
async function measureButtons(page: Page, scopes: string[]) {
  return page.evaluate(({ selector, scopes }) => scopes.map(scope => {
    const button = document.getElementById(scope);
    const rules = [...document.querySelectorAll<HTMLStyleElement>(selector)]
      .filter(style => style.textContent.includes('.nonce-' + scope + '-btn'));
    return {
      scope,
      nonces: [...new Set(rules.map(style => style.nonce))].sort(),
      applied: rules.some(style => Boolean(style.sheet?.cssRules.length)),
      color: button ? getComputedStyle(button).backgroundColor : null
    };
  }), { selector: scopedStyles, scopes });
}

/** It also checks token CSS and other rules that do not belong to one Button. */
async function expectScopedStyles(page: Page, nonce: string) {
  const styles = page.locator(scopedStyles);
  expect(await styles.count()).toBeGreaterThan(2);
  await expect.poll(() => styles.evaluateAll(
    (nodes, nonce) => nodes.every(node => node instanceof HTMLStyleElement &&
      node.nonce === nonce && Boolean(node.sheet?.cssRules.length)), nonce
  )).toBe(true);
}

test('ConfigProvider inherits, replaces and resets the CSP record', async ({ page }) => {
  await page.goto('/config-provider-csp.html');
  const scopes = reference.normal.initial.map(sample => sample.scope);

  await expect.poll(() => measureButtons(page, scopes)).toEqual(reference.normal.initial);
  await page.getByRole('button', { name: 'Change nonce' }).click();

  // In the benchmark, the existing styles retain the former nonce. This is the provider's scope updated here.
  const expected = reference.normal.updated.map(sample => ({
    ...sample,
    nonces: sample.scope === 'reset' ? sample.nonces : [nextNonce]
  }));
  await expect.poll(() => measureButtons(page, scopes)).toEqual(expected);
});

test('ConfigProvider applies scoped styles at mount and after a CSP nonce change', async ({ page }) => {
  await page.goto('/config-provider-csp.html?profile=strict');
  const control = page.getByRole('button', { name: 'Inherited button' });

  await expect.poll(() => measureButtons(page, strictScopes)).toEqual(reference.strict);
  await expectScopedStyles(page, firstNonce);
  const original = await control.elementHandle();
  await control.focus();
  await page.getByRole('button', { name: 'Change nonce' }).dispatchEvent('click');

  await expectScopedStyles(page, nextNonce);
  await expect(control).toHaveCSS('background-color', reference.strict[1].color);
  await expect(control).toBeFocused();
  expect(await control.evaluate((node, previous) => node === previous, original)).toBe(true);
});

test('ConfigProvider nonce reaches the scroll lock of a modal in ShadowRoot', async ({ page }) => {
  await page.goto('/config-provider-csp.html?profile=shadow');
  const html = page.locator('html');
  const lock = page.locator('style[data-ant-dialog-lock]');
  const originalOverflow = await html.evaluate(node => getComputedStyle(node).overflow);
  await page.getByRole('button', { name: 'Open CSP dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'CSP dialog' });

  await expect(dialog).toBeVisible();
  await expect.poll(() => lock.evaluate(node => (node as HTMLStyleElement).nonce)).toBe(firstNonce);
  await expect(html).toHaveCSS('overflow', 'hidden');
  const original = await dialog.elementHandle();
  await page.getByRole('button', { name: 'Change nonce', includeHidden: true }).dispatchEvent('click');

  await expect.poll(() => lock.evaluate(node => (node as HTMLStyleElement).nonce)).toBe(nextNonce);
  await expect(html).toHaveCSS('overflow', 'hidden');
  expect(await dialog.evaluate((node, previous) => node === previous, original)).toBe(true);
  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(lock).toHaveCount(0);
  await expect(html).toHaveCSS('overflow', originalOverflow);
});

test('nonce styles apply before hydration and remain usable after it', async ({ page }) => {
  const cacheUrl = new URL('../../../.upstream/artifacts/config-csp-ssr-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cacheUrl));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/config-provider-csp.server.ts', import.meta.url);
    const { renderConfigProviderCsp } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body }: { head: string; body: string } = renderConfigProviderCsp();
    await page.goto('/config-provider-csp.html?profile=strict&ssr');
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { head, body });
    await expect.poll(() => measureButtons(page, strictScopes)).toEqual(reference.strict);
    await expectScopedStyles(page, firstNonce);
    const styled = page.getByRole('button', { name: 'Inherited button' });
    const original = await styled.elementHandle();
    const control = page.getByRole('button', { name: 'Change nonce' });
    await control.focus();
    await expect(control).toBeFocused();

    await root.dispatchEvent('hydrate-csp');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expectScopedStyles(page, firstNonce);
    expect(await styled.evaluate((node, previous) => node === previous, original)).toBe(true);
    await expect(control).toBeFocused();

    await control.dispatchEvent('click');
    await expectScopedStyles(page, nextNonce);
    await expect(control).toBeFocused();
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
