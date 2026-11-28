import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-watch-observation.json' with { type: 'json' };

type Stage = keyof typeof observation.cases;

// The React trace retains the missing vector entry where Svelte observes null.
interface WatchCorrections {
  selected?: string;
  chosen?: string;
  opaque?: string;
  vector?: [null];
}

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-watch');
  await expect(page.locator('#form-watch-fixture')).toBeVisible();
}

async function action(page: Page, id: string) {
  await page.locator('#' + id).dispatchEvent('click');
}

async function readSnapshot(page: Page, includeEffects: boolean) {
  return page.evaluate((includeEffects) => {
    const nodeList = document.querySelectorAll<HTMLElement>('[data-watch]:not([data-watch="swap-context"])');
    const entries = Array.from(nodeList, (element) => [
      element.dataset.watch, JSON.parse(element.textContent ?? '')
    ]);
    if (includeEffects) {
      const trace = document.getElementById('watch-effects')?.textContent;
      entries.push(['effects', JSON.parse(trace ?? '')]);
    }

    return Object.fromEntries(entries);
  }, includeEffects);
}

async function check(
  page: Page,
  stage: Stage,
  corrections?: WatchCorrections
) {
  const sample = observation.cases[stage];
  const expected = { ...sample, outer: { ...sample.outer, ...corrections } };
  const includeEffects = 'effects' in sample;
  await expect.poll(() => readSnapshot(page, includeEffects), { message: stage }).toEqual(expected);
  if (includeEffects) {
    await action(page, 'clear-effects');
  }
}

test('Form watch follows edits, projections, option changes and model lifetimes', async ({ page }) => {
  await openFixture(page);
  await check(page, 'initial');
  await page.locator('#title-A').fill('typed');
  await check(page, 'userEdit');
  await action(page, 'A-context-write');
  await check(page, 'contextWrite');
  await action(page, 'merge-registered');
  await check(page, 'bulkWrite');
  await action(page, 'write-field');
  await check(page, 'fieldWrite');
  await action(page, 'reset-field');
  await check(page, 'reset');
  await action(page, 'write-hidden');
  await check(page, 'unregisteredWrite');

  await action(page, 'toggle-preserve');
  expect(observation.cases.preserveToggle.outer.selected).toEqual({ missing: true });
  await check(page, 'preserveToggle', { selected: 'private update' });
  await action(page, 'batch-writes');
  await check(page, 'batchedWrites');
  await action(page, 'change-opaque');
  expect(observation.cases.nonSerializableEquality.outer.opaque).toBe('first');
  expect(observation.cases.nonSerializableEquality.outer.vector).toEqual([{ missing: true }]);
  const updatedIdentity = { opaque: 'second', vector: [null] } satisfies WatchCorrections;
  await check(page, 'nonSerializableEquality', updatedIdentity);

  await action(page, 'toggle-title');
  await check(page, 'fieldRemoved', updatedIdentity);
  await action(page, 'toggle-title');
  await check(page, 'fieldRegistered', updatedIdentity);
  await action(page, 'move-rows');
  await check(page, 'listMove', updatedIdentity);
  await action(page, 'watch-profile');
  await check(page, 'pathChanged', updatedIdentity);

  await action(page, 'watch-second');
  expect(observation.cases.modelChanged.outer.chosen).toBe('context write');
  await check(page, 'modelChanged', { ...updatedIdentity, chosen: 'beta' });
  await action(page, 'write-new-model');
  await check(page, 'newModelWrite', { ...updatedIdentity, chosen: 'B changed' });
  await action(page, 'write-old-model');
  expect(observation.cases.oldModelWrite.outer.chosen).toBe('old model write');
  await check(page, 'oldModelWrite', { ...updatedIdentity, chosen: 'B changed' });
  await action(page, 'toggle-model');
  await check(page, 'clearedModel', { chosen: 'B changed' });
  await action(page, 'detached-write');
  await check(page, 'detachedWrite', { chosen: 'B changed' });
  await action(page, 'toggle-model');
  await check(page, 'reattachedModel', { chosen: 'B changed' });
});

test('Form context observers and actions follow model replacement in place', async ({ page }) => {
  await openFixture(page);
  const editor = page.locator('#context-title');
  const output = page.locator('[data-watch="swap-context"]');
  await expect(editor).toHaveValue('context one');
  await expect(output).toContainText('"title":"context one"');
  const node = await editor.elementHandle();

  await action(page, 'swap-context-model');
  await expect(editor).toHaveValue('context two');
  await expect(output).toContainText('"title":"context two"');
  await expect(output).toContainText('"matchesOwner":true');
  expect(await editor.evaluate((element, previous) => element === previous, node)).toBe(true);
  await action(page, 'swap-context-write');
  await expect(editor).toHaveValue('swapped write');
  await expect(output).toContainText('"title":"swapped write"');

  await action(page, 'swap-context-model');
  await expect(editor).toHaveValue('context one');
  await expect(output).toContainText('"title":"context one"');
});
