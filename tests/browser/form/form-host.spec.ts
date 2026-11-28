import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-host-observation.json' with { type: 'json' };

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-owner]');
    const editor = document.querySelector<HTMLInputElement>('input[data-editor]');
    const report = document.getElementById('form-host-state');
    if (!report?.textContent) {
      throw new Error('Missing form host state');
    }
    return {
      ...JSON.parse(report.textContent),
      tag: root?.tagName ?? null,
      id: root?.getAttribute('id') ?? null,
      name: root?.getAttribute('name') ?? null,
      value: editor?.value ?? null,
      rendered: document.getElementById('root-value')?.textContent ?? null
    };
  });
}

async function openHost(page: Page) {
  await page.goto('/?fixture=form-host');
  await expect.poll(() => snapshot(page)).toMatchObject({ bound: true, refTag: 'FORM' });
}

async function writeWord(page: Page, word: string) {
  await page.locator('#host-draft').fill(word);
  await page.locator('#host-write').click();
}

test('Form switches hosts and retains the mounted ref, values and native event ownership', async ({ page }) => {
  await openHost(page);
  await page.locator('#host-remember').click();
  const events: unknown[] = [];

  async function check(stage: keyof typeof observation.stages) {
    const { tag, id, value, store, refTag, nativeMatches, rendered, events: appended } =
      observation.stages[stage];
    const sample = observation.stages[stage];
    events.push(...appended.map(event => event.type === 'finish' ? { ...event, values: store } : event));
    const expected: Record<string, unknown> = {
      tag, id, value, store, refTag, nativeMatches, rendered, events,
      name: tag ? 'named-owner' : null, sameRef: true
    };
    if ('defaultPrevented' in sample) expected.prevented = sample.defaultPrevented;
    if ('returnType' in sample) expected.returnType = sample.returnType;
    if ('originalRefConnected' in sample) expected.originalRefConnected = sample.originalRefConnected;

    await expect.poll(() => snapshot(page), { message: stage }).toMatchObject(expected);
  }

  await check('native');
  await page.locator('#host-ref-submit').click();
  await check('imperative');
  await writeWord(page, 'draft');
  await page.locator('#host-native-reset').click();
  await check('reset');
  await writeWord(page, '');
  await page.locator('#host-native-submit').click();
  await check('invalid');
  await expect(page.locator('input[data-editor]')).toBeFocused();

  await page.locator('#host-kind').selectOption('bare');
  await check('unwrapped');
  await writeWord(page, 'context value');
  await page.locator('#host-ref-submit').click();
  await check('unwrappedSubmit');
  await page.locator('#host-model-submit').click();
  await check('modelSubmit');

  await page.locator('#host-show-render').click();
  await check('render');
  await writeWord(page, 'written');
  await check('renderWrite');
  await page.locator('#host-kind').selectOption('custom');
  await check('custom');
  const custom = page.locator('article[data-owner]');
  await expect(custom).toHaveClass(/\bform-host-root\b/);
  await expect(custom).toHaveCSS('padding-top', '4px');
  await page.locator('#reset-from-render').click();
  await check('renderReset');
  await writeWord(page, 'custom edit');
  await page.locator('#host-native-submit').click();
  await check('customSubmit');
  await page.locator('#host-native-reset').click();
  await check('customReset');

  await page.locator('#host-kind').selectOption('section');
  await check('tag');
  await page.locator('#host-kind').selectOption('no-ref');
  await check('customWithoutNative');
  await expect(page.locator('aside[data-owner]')).not.toHaveAttribute('nativeElement');

  await page.locator('#host-remove').click();
  await expect.poll(() => snapshot(page)).toMatchObject({
    bound: Boolean(observation.detachedRef), retainedHost: null, value: null
  });
  await page.locator('#host-retained-submit').click();
  expect(await snapshot(page)).toMatchObject({ events });
});

test('Form render and ref follow the active model without replacing the editor', async ({ page }) => {
  await openHost(page);
  await page.locator('#host-remember').click();
  await page.locator('#host-show-render').click();
  const input = page.locator('input[data-editor]');
  const original = await input.elementHandle();
  await input.fill('user edit');
  await expect(page.locator('#root-value')).toHaveText('{"word":"user edit","untouched":"extra"}');
  await expect(page.locator('#render-model-word')).toHaveText('user edit');

  await page.locator('#host-replace-model').dispatchEvent('click');
  await expect.poll(() => snapshot(page)).toMatchObject({
    sameRef: true, nativeMatches: true, originalRefConnected: true, value: 'replacement',
    store: { word: 'replacement', untouched: 'other' }
  });
  expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect(input).toBeFocused();

  await writeWord(page, 'new model');
  await expect(page.locator('#render-model-word')).toHaveText('new model');
  await page.locator('#host-explicit-submit').click();
  await expect.poll(() => snapshot(page)).toMatchObject({
    events: [{ type: 'explicit', values: { word: 'new model', untouched: 'other' } },
      { type: 'result', status: 'success' }]
  });
});

test('Form shares pending submission state between native, model and ref entry points', async ({ page }) => {
  await openHost(page);
  await page.locator('#host-disable').click();
  await page.locator('#host-native-submit').click();
  expect(await snapshot(page)).toMatchObject({ prevented: true, events: [] });
  await page.locator('#host-hold').click();
  await page.locator('#host-model-submit').click();
  const root = page.locator('form[data-owner]');
  await expect(root).toHaveAttribute('aria-busy', 'true');
  const finish = { type: 'finish', values: { word: 'start', untouched: 'extra' } };
  expect(await snapshot(page)).toMatchObject({ submitCalls: 1, events: [finish] });
  await page.locator('#host-ref-submit').click();
  expect(await snapshot(page)).toMatchObject({ returnType: 'undefined', events: [finish] });
  await page.locator('#host-release').click();
  await expect(root).not.toHaveAttribute('aria-busy');
  await page.locator('#host-ref-submit').click();
  await expect.poll(() => snapshot(page)).toMatchObject({ events: [finish, finish] });
});

test('Form hydrates a custom host and retains the focused SSR editor', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-host-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixture = new URL('../fixtures/form-host-hydration.server.ts', import.meta.url);
    const { renderFormHost } = await server.ssrLoadModule(fileURLToPath(fixture));
    const { head, body } = renderFormHost();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const target = document.getElementById('root');
      if (!target) throw new Error('The hydration host is missing');
      target.innerHTML = body;
    }, { head, body });

    const input = page.locator('input[data-editor]');
    await input.focus();
    await page.addScriptTag({ type: 'module', url: '/form-host-hydration.client.ts' });
    await page.waitForFunction(() => window.formHostHydration !== undefined);
    await expect.poll(() => snapshot(page)).toMatchObject({
      tag: 'ARTICLE', refTag: 'ARTICLE', nativeMatches: true, value: 'start'
    });
    expect(await input.evaluate(node => node === window.formHostHydration?.input)).toBe(true);
    expect(await input.evaluate(node => node === document.activeElement)).toBe(true);
    await input.fill('hydrated edit');
    await expect(page.locator('#root-value')).toHaveText('{"word":"hydrated edit","untouched":"extra"}');
    await page.evaluate(() => window.formHostHydration?.dispose());
    await expect(page.locator('article[data-owner]')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
