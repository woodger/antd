import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-events-observation.json' with { type: 'json' };

type Stage = keyof typeof observation.stages;
type Trace = unknown[][];

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-events');
  await expect(page.locator('#form-events-fixture')).toBeVisible();
}

async function readTrace(page: Page): Promise<Trace> {
  const text = await page.locator('#form-events').textContent();
  return JSON.parse(text ?? '');
}

function withoutAllFields(events: Trace) {
  return events.map((event) => String(event[0]).endsWith('-fields') ? event.slice(0, 2) : event);
}

async function apply(page: Page, id: string) {
  // Model operations do not move focus while the fixture dispatches their button handlers.
  await page.locator('#' + id).dispatchEvent('click');
}

async function checkStage(
  page: Page,
  stage: Stage,
  expected: Trace = observation.stages[stage]
) {
  await expect.poll(async () => withoutAllFields(await readTrace(page)), { message: stage })
    .toEqual(expected);
  await apply(page, 'clear-form-events');
}

function withSubmitMetadata(stage: 'submit' | 'failedSubmitStarted') {
  return observation.stages[stage].map(([event, first, second, ...tail]) => {
    if (event === 'alpha-finish') {
      return [event, { ...first as object, unbound: 7 }];
    }
    if (event === 'inner-finish' || event === 'outer-finish') {
      return [event, first, { ...second as object, unbound: 7 }, ...tail];
    }

    // The existing Svelte submit marks fields touched and keeps visible errors until settlement.
    const fields = (event === 'alpha-fields' ? first : second) as object[];
    const changes = fields.map((field) => stage === 'submit'
      ? { ...field, touched: true } : { ...field, errors: ['Rejected'] });

    return event === 'alpha-fields' ? [event, changes] : [event, first, changes, ...tail];
  });
}

test('Form publishes edits, validation and submission in the observed order', async ({ page }) => {
  await openFixture(page);
  await checkStage(page, 'mounted');
  const plain = page.locator('#alpha-plain');
  const title = page.locator('#alpha-title');
  await plain.fill('alpha plain');

  // Every callback shares the same changed entries with the all-fields array.
  const allFields = (await readTrace(page)).find(([event]) => event === 'alpha-fields')?.[2];
  expect(allFields).toEqual(expect.arrayContaining(observation.ordinaryAllFields));
  expect(allFields).toHaveLength(observation.ordinaryAllFields.length);
  await checkStage(page, 'ordinaryChange');

  await title.fill('bad');
  await expect(page.locator('#form-event-pending')).toHaveText('["bad"]');
  await checkStage(page, 'validationStarted');
  await apply(page, 'reject-bad');
  await checkStage(page, 'validationFinished');
  await expect(title).toHaveAttribute('aria-invalid', 'true');

  await apply(page, 'write-form-values');
  await expect(title).toHaveValue('ok');
  await expect(plain).toHaveValue('programmatic');
  await checkStage(page, 'programmaticWrites');
  await apply(page, 'validate-form-values');
  await checkStage(page, 'validation');
  await apply(page, 'validate-only');
  await checkStage(page, 'validationOnly');

  await apply(page, 'list-add');
  await checkStage(page, 'listAdd');
  await apply(page, 'list-move');
  await checkStage(page, 'listMove');
  await apply(page, 'list-remove');
  await checkStage(page, 'listRemove');
  await apply(page, 'reset-form-values');
  await expect(plain).toHaveValue('');
  await checkStage(page, 'reset');

  await plain.fill('ready');
  await checkStage(page, 'beforeSubmit');
  await page.locator('#alpha-submit').click();
  await checkStage(page, 'submit', withSubmitMetadata('submit'));

  await page.locator('#unnamed-plain').fill('unnamed');
  await checkStage(page, 'unnamedChange');
  await page.locator('#unnamed-submit').click();
  await checkStage(page, 'unnamedFinish');
  await page.locator('#empty-plain').fill('empty name');
  await checkStage(page, 'emptyNameChange');
  await page.locator('#peer-plain').fill('peer plain');
  await checkStage(page, 'peerChange');
  await apply(page, 'submit-peer-model');
  await checkStage(page, 'peerProgrammaticSubmit');

  await apply(page, 'rename-alpha');
  await expect(page.locator('form[name="renamed"]')).toHaveCount(1);
  await expect(page.locator('#peer-plain')).toHaveCount(0);
  await plain.fill('renamed');
  await checkStage(page, 'renamed');
  const tables = await page.locator('#form-event-tables').textContent();
  expect(JSON.parse(tables ?? '')).toEqual(observation.identity);

  await title.fill('wait-first');
  await checkStage(page, 'firstValidationStarted');
  await title.fill('wait-second');
  await expect(page.locator('#form-event-pending')).toHaveText('["wait-first","wait-second"]');
  await checkStage(page, 'secondValidationStarted');
  await apply(page, 'accept-second');
  await checkStage(page, 'secondValidationFinished');
  await apply(page, 'reject-first');
  await expect(page.locator('#form-event-finished')).toContainText('"wait-first"');

  expect(observation.stages.firstValidationFinished[0][2])
    .toMatchObject([{ errors: ['Stale rejection'] }]);
  // React exposes a stale error to observers even though it is no longer the field's result.
  expect(await readTrace(page)).toEqual([]);
  await expect(title).not.toHaveAttribute('aria-invalid', 'true');

  await title.fill('bad');
  await checkStage(page, 'beforeFailedSubmit');
  await apply(page, 'reject-bad');
  await checkStage(page, 'beforeFailedSubmitSettled');
  await page.locator('#alpha-submit').click();
  await checkStage(page, 'failedSubmitStarted', withSubmitMetadata('failedSubmitStarted'));
  await apply(page, 'reject-bad');
  await checkStage(page, 'failedSubmitFinished');
  await expect(title).toBeFocused();
});

test('FormProvider keeps a live registration when an older duplicate leaves', async ({ page }) => {
  await openFixture(page);
  await apply(page, 'rename-alpha');
  await expect(page.locator('#peer-plain')).toHaveCount(0);
  await apply(page, 'show-duplicate');
  await page.locator('#peer-plain').fill('latest owner');
  await checkStage(page, 'duplicateMounted');

  await apply(page, 'drop-peer');
  await page.locator('#alpha-plain').fill('previous owner');
  const restored = (await readTrace(page)).find(([event]) => event === 'outer-change');
  expect(restored?.[3]).toEqual({ renamed: 'alpha' });
  await apply(page, 'clear-form-events');

  await apply(page, 'show-duplicate');
  await apply(page, 'drop-alpha');
  await expect(page.locator('#alpha-plain')).toHaveCount(0);
  await page.locator('#peer-plain').fill('after old owner leaves');
  const previousUnmounted = observation.stages.duplicatePreviousUnmounted;
  expect(previousUnmounted.find(([event]) => event === 'outer-change')?.[3]).toEqual({});
  const expected = previousUnmounted.map((event) =>
    event[0] === 'outer-change' ? [...event.slice(0, 3), { renamed: 'peer' }] : event
  );
  await checkStage(page, 'duplicatePreviousUnmounted', expected);
});

test('FormProvider replaces the model and drops validation events from the previous model', async ({ page }) => {
  await openFixture(page);
  await page.locator('#alpha-title').fill('wait-first');
  await expect(page.locator('#form-event-pending')).toHaveText('["wait-first"]');
  await apply(page, 'replace-alpha');
  await expect(page.locator('#alpha-plain')).toHaveValue('replacement');
  await apply(page, 'clear-form-events');
  await apply(page, 'reject-first');
  await expect(page.locator('#form-event-finished')).toContainText('"wait-first"');

  expect(await readTrace(page)).toEqual([]);
  await page.locator('#alpha-plain').fill('new value');
  const change = (await readTrace(page)).find(([event]) => event === 'inner-change');
  expect(change).toMatchObject(['inner-change', 'alpha', [{ value: 'new value' }], { alpha: 'alpha' }]);
});
