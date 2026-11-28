import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-initial-values-observation.json' with { type: 'json' };

const missing = { missing: true };
const automaticFields = ['word', 'local'];
const externalFields = ['word', 'code', 'removable', 'local'];

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-initial-values');
  await expect(page.locator('#form-initial-values-fixture')).toBeVisible();
}

async function readView(page: Page, prefix: string, fields: readonly string[]) {
  return page.evaluate(({ prefix, fields, missing }) => {
    const get = (suffix: string) => document.getElementById(prefix + '-' + suffix);
    const result: Record<string, unknown> = {
      values: JSON.parse(get('values')?.textContent ?? '')
    };
    for (const field of fields) {
      const input = get(field);
      result[field] = input instanceof HTMLInputElement ? input.value : missing;
    }
    const events = get('events');
    if (events) {
      result.events = JSON.parse(events.textContent ?? '[]');
      const rows = document.querySelectorAll<HTMLInputElement>('input.' + prefix + '-row');
      result.rows = Array.from(rows, input => input.value);
    }

    return result;
  }, { prefix, fields, missing });
}

test('Form owns an isolated model and follows a supplied model in place', async ({ page }) => {
  await openFixture(page);
  await expect.poll(() => readView(page, 'auto', automaticFields)).toEqual(observation.ssr);

  await page.locator('#auto-edit').click();

  await expect.poll(() => readView(page, 'auto', automaticFields)).toEqual(observation.automaticEdited);
  await expect.poll(() => readView(page, 'other-auto', automaticFields)).toEqual(observation.ssr);
  await page.locator('#auto-submit').click();
  await expect(page.locator('#auto-submitted')).toHaveText(JSON.stringify(observation.automaticEdited.values));

  const word = page.locator('#auto-word');
  await word.focus();
  const input = await word.elementHandle();
  await page.locator('#replace-automatic').dispatchEvent('click');

  await expect(word).toHaveValue('replacement');
  await expect(word).toBeFocused();
  expect(await word.evaluate((node, previous) => node === previous, input)).toBe(true);
  await expect.poll(() => readView(page, 'auto', automaticFields)).toMatchObject({
    rows: ['from form list'], values: { word: 'replacement', modelOnly: 'constructor default' }
  });

  await page.locator('#auto-reset').click();
  await expect(word).toHaveValue('from form');
  await expect(page.locator('#auto-values')).toContainText('"modelOnly":"constructor default"');
  await page.locator('#replace-automatic').click();
  await expect(word).toHaveValue(observation.automaticEdited.word);

  await word.fill('native edit');
  await expect(page.locator('#auto-events')).toContainText('"word":"native edit"');
  await page.locator('#auto-reset').click();
  await expect(word).toHaveValue(observation.automaticReset.word);
});

test('Form seeds gaps and applies later defaults on reset and non-preserved removal', async ({ page }) => {
  await openFixture(page);
  await expect.poll(() => readView(page, 'external', externalFields))
    .toEqual(observation.external.firstMount);

  const code = page.locator('#external-code');
  await code.focus();
  await code.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 3));
  const input = await code.elementHandle();
  await page.locator('#change-defaults').dispatchEvent('click');

  await expect.poll(() => readView(page, 'external', externalFields))
    .toEqual(observation.external.changeDefaults);
  await expect(code).toBeFocused();
  expect(await code.evaluate((node, previous) => node === previous, input)).toBe(true);
  expect(await code.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]))
    .toEqual([1, 3]);

  const transitions = [
    ['reset-code', 'resetPath'], ['toggle-removable', 'removeField'],
    ['toggle-removable', 'remountField'], ['reset-external', 'resetAll'],
    ['remove-defaults', 'removeDefaults'], ['reset-external', 'resetNoDefaults']
  ] as const;
  for (const [button, stage] of transitions) {
    await page.locator('#' + button).click();
    await expect.poll(() => readView(page, 'external', externalFields), { message: stage })
      .toEqual(observation.external[stage]);
  }

  await page.locator('#validate-defaults').click();
  await expect(page.locator('#dirty-result')).toHaveText(JSON.stringify(observation.dirty.before));
  await expect(page.locator('#external-events'))
    .toHaveText(JSON.stringify(observation.dirty.beforeEvents));
  await page.locator('#default-late').click();
  await expect(page.locator('#external-events'))
    .toHaveText(JSON.stringify(observation.dirty.defaultAppliedEvents));
  await page.locator('#validate-defaults').click();

  await expect(page.locator('#dirty-result')).toHaveText(JSON.stringify(observation.dirty.after));
  await expect(page.locator('#external-late')).toHaveValue('');
  await expect(page.locator('#external-values')).not.toContainText('"late"');
  await expect(page.locator('#external-events'))
    .toHaveText(JSON.stringify(observation.dirty.finalEvents));
});

for (const id of ['preserve', 'clear'] as const) {
  test(`Form reapplies defaults beneath detached writes when reattaching in ${id} mode`, async ({ page }) => {
    await openFixture(page);
    const fields = ['keep', 'remove'];
    await expect.poll(() => readView(page, id, fields)).toEqual(observation[id].mount);

    const transitions = [
      ['detach', 'detached'], ['edit', 'detachedWrite'],
      ['attach', 'reattached'], ['reset', 'reset']
    ] as const;
    for (const [action, stage] of transitions) {
      await page.locator('#' + id + '-' + action).click();
      await expect.poll(() => readView(page, id, fields), { message: stage })
        .toEqual(observation[id][stage]);
    }
  });
}

test('Form keeps the focused editor through hydration and uses the hydrated model for reset', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-initial-values-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixture = new URL('../fixtures/form-initial-values-hydration.server.ts', import.meta.url);
    const { renderFormInitialValues } = await server.ssrLoadModule(fileURLToPath(fixture));
    const { head, body } = renderFormInitialValues();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const target = document.getElementById('root');
      if (!target) throw new Error('The hydration host is missing');
      target.innerHTML = body;
    }, { head, body });

    const input = page.locator('#auto-word');
    await input.focus();
    await expect.poll(() => readView(page, 'auto', automaticFields)).toEqual(observation.ssr);

    await page.addScriptTag({ type: 'module', url: '/form-initial-values-hydration.client.ts' });
    await page.waitForFunction(() => window.formInitialValuesHydration !== undefined);

    const { sameInput, focused, ...hydrated } = observation.hydrated;
    await expect.poll(() => readView(page, 'auto', automaticFields)).toEqual(hydrated);
    expect(await input.evaluate(node => node === window.formInitialValuesHydration?.input)).toBe(sameInput);
    expect(await input.evaluate(node => node === document.activeElement)).toBe(focused);
    await page.locator('#auto-edit').click();
    await expect.poll(() => readView(page, 'auto', automaticFields)).toEqual(observation.automaticEdited);
    await page.locator('#auto-reset').click();
    await expect.poll(() => readView(page, 'auto', automaticFields)).toEqual(observation.automaticReset);
    await page.evaluate(() => window.formInitialValuesHydration?.dispose());
    await expect(page.locator('form')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
