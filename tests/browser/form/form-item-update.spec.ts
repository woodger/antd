import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-item-update-observation.json' with { type: 'json' };

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-item-update');
  await expect(page.locator('#note')).toHaveValue('start');
}

async function readSnapshot(page: Page, ids: string[]) {
  return page.evaluate(ids => {
    const entries = ids.map(id => [id, JSON.parse(document.getElementById(id)?.textContent ?? '')]);
    return Object.fromEntries(entries);
  }, ids);
}

async function readMain(page: Page) {
  const { 'form-update-events': events, ...rendered } = await readSnapshot(page, [
    'unconditional', 'predicate', 'dependent', 'form-update-events'
  ]);
  return { rendered, events };
}

async function compareMain(page: Page, stage: keyof typeof observation.cases) {
  await expect.poll(() => readMain(page), { message: stage }).toEqual(observation.cases[stage]);
  await page.locator('#clear-update-events').dispatchEvent('click');
}

test('FormItem selects render snapshots from control, batch and reset updates', async ({ page }) => {
  await openFixture(page);
  await compareMain(page, 'initial');
  await page.locator('#note').fill('user');
  await compareMain(page, 'internalSibling');
  await page.locator('#enabled').click();
  await compareMain(page, 'internalDependency');

  for (const stage of ['external', 'single', 'batch', 'metadata', 'resetOne', 'resetAll'] as const) {
    await page.locator('#' + stage).click();
    await compareMain(page, stage);
  }
});

test('FormItem predicates see intermediate writes, metadata, registration and validation', async ({ page }) => {
  await openFixture(page);
  const stages = [
    'initial', 'externalSibling', 'externalSiblingAgain', 'sameSingle', 'intermediateOnly',
    'metadataOnly', 'mountBranch', 'unmountBranch', 'validate', 'validateOnly'
  ] as const;
  let validations = 0;
  const guard = page.locator('#guard');
  await expect(guard).toHaveAttribute('data-guard', observation.extended.initial.guardLabel);
  const editor = await guard.elementHandle();

  for (const stage of stages) {
    if (stage !== 'initial') {
      await page.locator('#' + stage).click();
    }
    if (stage === 'validate' || stage === 'validateOnly') {
      validations++;
      await expect(page.locator('#extra-finished')).toHaveText(String(validations));
    }
    const { rendered, events, named, guardLabel } = observation.extended[stage];
    await expect(guard).toHaveAttribute('data-guard', guardLabel);
    if (stage === 'metadataOnly') {
      expect(await guard.evaluate((node, previous) => node === previous, editor)).toBe(true);
    }

    await expect.poll(async () => {
      const { 'extra-events': events, 'named-events': named, ...rendered } = await readSnapshot(
        page, ['always', 'gated', 'related', 'extra-events', 'named-events']
      );
      return { rendered, events, named };
    }, { message: stage }).toEqual({ rendered, events, named });
    await page.locator('#extra-clear').dispatchEvent('click');
  }

  await expect(page.locator('#other-note')).toHaveValue('final');
  await expect(page.locator('#branch')).toHaveCount(0);
});

test('FormItem keeps render content in place until full reset and follows model replacement', async ({ page }) => {
  await openFixture(page);
  const local = page.locator('#render-draft');
  await local.fill('draft');
  await local.evaluate(input => {
    if (input instanceof HTMLInputElement) input.setSelectionRange(1, 3);
  });
  const original = await local.elementHandle();
  await page.locator('#batch').dispatchEvent('click');
  await expect(page.locator('#unconditional')).toContainText('"note":"last"');
  await page.locator('#resetOne').dispatchEvent('click');

  await expect(local).toHaveValue('draft');
  expect(await local.evaluate((node, previous) => node === previous, original)).toBe(true);
  await page.locator('#resetAll').dispatchEvent('click');
  await expect(local).toHaveValue('local');
  await expect(local).toBeFocused();
  expect(await local.evaluate((node, previous) => node === previous, original)).toBe(false);
  expect(await local.evaluate(node => node instanceof HTMLInputElement
    ? [node.selectionStart, node.selectionEnd] : [])).toEqual([1, 3]);

  await page.locator('#clear-update-events').dispatchEvent('click');
  await page.locator('#swap-update-model').dispatchEvent('click');
  await expect(page.locator('#predicate')).toHaveText('{"enabled":true,"note":"replacement"}');
  await expect(page.locator('#note')).toHaveValue('replacement');
  await page.locator('#write-inactive-model').dispatchEvent('click');

  await expect(page.locator('#predicate')).toHaveText('{"enabled":true,"note":"replacement"}');
  await expect(page.locator('#form-update-events')).toHaveText('[]');
});

test('FormItem render snapshots hydrate in place and use the first control update', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-item-update-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixture = fileURLToPath(new URL('../fixtures/form-item-update-hydration.server.ts', import.meta.url));
    const { renderFormItemUpdates } = await server.ssrLoadModule(fixture);
    const { head, body } = renderFormItemUpdates();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const target = document.getElementById('root');
      if (!target) {
        throw new Error('The hydration host is missing');
      }
      target.innerHTML = body;
    }, { head, body });

    const input = page.locator('#note');
    await input.focus();
    await expect.poll(() => readMain(page)).toEqual(observation.ssr);
    await page.addScriptTag({ type: 'module', url: '/form-item-update-hydration.client.ts' });
    await page.waitForFunction(() => window.formItemUpdateHydration !== undefined);

    await expect(input).toBeFocused();
    expect(await input.evaluate(node => node === window.formItemUpdateHydration?.input)).toBe(true);
    await input.fill('user');
    await compareMain(page, 'internalSibling');
    await page.evaluate(() => window.formItemUpdateHydration?.dispose());
    await expect(page.locator('form')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
