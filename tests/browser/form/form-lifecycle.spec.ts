import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-lifecycle-observation.json' with { type: 'json' };

type Stage = keyof typeof observation.cases;

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-lifecycle');
  await expect(page.locator('#form-lifecycle-fixture')).toBeVisible();
}

async function action(page: Page, id: string) {
  // Fixture actions change model or component state without moving focus.
  await page.locator('#' + id).dispatchEvent('click');
}

async function modelReport(page: Page, id: string) {
  const json = await page.locator(`[data-model="${id}"]`).textContent();
  return JSON.parse(json ?? '');
}

async function check(
  page: Page, model: string, stage: Stage, expected: object = observation.cases[stage]
) {
  await expect.poll(() => modelReport(page, model), { message: stage }).toEqual(expected);
}

test('Form preserves or restores values on field unmount, remount and rename', async ({ page }) => {
  await openFixture(page);
  await check(page, 'preserve', 'initial');
  await action(page, 'field-drafts');
  await action(page, 'toggle-fields');
  await check(page, 'preserve', 'fieldUnmount');
  await action(page, 'toggle-fields');
  await check(page, 'preserve', 'fieldRemount');
  await expect(page.locator('#item-only')).toHaveValue('item initial');

  await action(page, 'change-inheritance');
  await action(page, 'toggle-fields');
  await check(page, 'preserve', 'formPreserveToggle');
  await action(page, 'duplicate-draft');
  await action(page, 'change-inheritance');
  await action(page, 'remove-first');
  await check(page, 'preserve', 'duplicateRemains');
  await expect(page.locator('#second-duplicate')).toHaveValue('duplicate draft');
  await action(page, 'remove-second');
  await check(page, 'preserve', 'lastDuplicateLeaves');

  await action(page, 'rename-drafts');
  const editor = page.locator('#rename');
  const element = await editor.elementHandle();
  await action(page, 'rename-field');
  await check(page, 'preserve', 'renamed');
  await expect(editor).toHaveValue('draft second');
  expect(await editor.evaluate((node, previous) => node === previous, element)).toBe(true);
  await action(page, 'preserve-renamed');
  await action(page, 'rename-field');
  await check(page, 'preserve', 'fieldPreserveToggle');
});

test('Form restarts dependent validation on discarded fields without publishing an edit', async ({ page }) => {
  await openFixture(page);
  await action(page, 'driver-draft');
  await expect(page.locator('#driver')).toHaveValue('driver draft');
  await action(page, 'remove-driver');
  await check(page, 'dep', 'removalDependencies');
});

test('Form clears its detached model and restores defaults under detached writes on reattach', async ({ page }) => {
  await openFixture(page);
  await action(page, 'detach-drafts');
  await action(page, 'switch-clear');
  await action(page, 'toggle-keep');
  await check(page, 'keep', 'detachPreserved');
  await action(page, 'toggle-clear');
  await check(page, 'clear', 'detachCleared');
  await action(page, 'detached-write');
  await action(page, 'toggle-clear');
  await expect(page.locator('#clear-description')).toHaveValue('item initial');
  await check(page, 'clear', 'attachCleared');

  await action(page, 'toggle-switched');
  expect(observation.cases.detachAfterPropChange.values.title).toBe('title draft');
  await check(page, 'switched', 'detachAfterPropChange', { values: {}, fields: {} });
});

test('Form preserves the live owner of a shared model until the last owner leaves', async ({ page }) => {
  await openFixture(page);
  await action(page, 'shared-draft');
  await action(page, 'remove-first-owner');

  expect(observation.cases.oneSharedOwnerLeaves.values).toEqual({});
  await expect(page.locator('#shared-second-value')).toHaveValue('shared draft');
  await check(page, 'shared', 'oneSharedOwnerLeaves', {
    values: { value: 'shared draft' }, fields: { value: 'shared draft' }
  });
  await action(page, 'remove-second-owner');
  await check(page, 'shared', 'bothSharedOwnersLeave');
});

test('FormList applies preserve to the current row through moves, nesting and removal', async ({ page }) => {
  await openFixture(page);
  await action(page, 'remove-direct');
  await check(page, 'list', 'directListField');
  const [initialA, initialB] = observation.cases.directListField.values.rows;

  await action(page, 'move-rows');
  await expect(page.locator('form[name="lists"] section').first()).toHaveAttribute('id', 'row-B');
  await action(page, 'toggle-A');
  expect(observation.cases.movedFieldUnmount.values.rows[0].nested).toEqual({});
  await check(page, 'list', 'movedFieldUnmount', {
    ...observation.cases.movedFieldUnmount,
    values: { rows: [initialB, { ...initialA, nested: {} }] }
  });

  await action(page, 'toggle-A');
  await action(page, 'toggle-list');
  expect(observation.cases.listUnmount.values.rows[1].nested).toEqual({});
  await check(page, 'list', 'listUnmount', { values: { rows: [initialA, initialB] }, fields: {} });

  await action(page, 'toggle-list');
  await action(page, 'list-drafts');
  await action(page, 'toggle-sub');
  await action(page, 'move-rows');
  await action(page, 'toggle-sub');
  const nested = observation.cases.nestedListUnmount;
  const [rowB, rowA] = nested.values.rows;
  expect(rowB.sub).toEqual([{}]);
  await check(page, 'list', 'nestedListUnmount', {
    ...nested,
    values: { rows: [{ ...rowB, sub: [{ title: 'nested B' }] }, { ...rowA, sub: [{}] }] }
  });

  await action(page, 'move-rows');
  await action(page, 'toggle-sub');
  await action(page, 'remove-row');
  expect(observation.cases.rowRemoval.values.rows[0].nested).toEqual({});
  await check(page, 'list', 'rowRemoval', {
    values: { rows: [{ ...rowB, sub: [{ title: 'nested B' }] }] },
    fields: { rows: [] }
  });

  await action(page, 'sparse-rows');
  const renderedRows = page.locator('form[name="lists"] section');
  await expect(renderedRows).toHaveCount(2);
  await action(page, 'toggle-A');
  await expect.poll(() => modelReport(page, 'list')).toEqual({
    values: { rows: [
      { id: 'A', nested: {}, plain: 'A keep', sub: [] },
      { missing: true },
      { id: 'B', nested: { text: 'sparse B' }, plain: 'B keep', sub: [] }
    ] },
    fields: { rows: [{ sub: [] }] }
  });
  await expect(renderedRows).toHaveCount(2);
});

test('Form clears a replaced model and restores it when reattached in place', async ({ page }) => {
  await openFixture(page);
  const input = page.locator('#swapped-value');
  await expect(input).toHaveValue('first default');
  const editor = await input.elementHandle();
  await action(page, 'swap-model');
  await expect(input).toHaveValue('replacement default');
  await expect.poll(() => modelReport(page, 'original')).toEqual({ values: {}, fields: {} });
  expect(await input.evaluate((node, previous) => node === previous, editor)).toBe(true);

  await action(page, 'swap-model');
  await expect(input).toHaveValue('first default');
  await expect.poll(() => modelReport(page, 'replacement')).toEqual({ values: {}, fields: {} });
});

test('Form keeps a new submission pending when a detached submission fails', async ({ page }) => {
  await openFixture(page);
  const busy = page.locator('#submit-busy');
  const submissions = page.locator('#submit-starts');
  await page.locator('#submit-form').click();
  await expect(submissions).toHaveText('[1]');
  await expect(busy).toHaveText('true');

  await action(page, 'toggle-submit');
  await expect(busy).toHaveText('false');
  await action(page, 'toggle-submit');
  await page.locator('#submit-form').click();
  await expect(submissions).toHaveText('[1,2]');

  await action(page, 'reject-old');
  await expect(busy).toHaveText('true');
  await expect(page.locator('#submit-error')).toHaveText('');
  await action(page, 'complete-new');
  await expect(busy).toHaveText('false');
});
