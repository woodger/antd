import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-validation-trigger-observation.json' with { type: 'json' };

type Trace = unknown[][];
type Stage = keyof typeof observation.cases;

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-validation-triggers');
  await expect(page.locator('#form-validation-trigger-fixture')).toBeVisible();
}

async function readTrace(page: Page): Promise<Trace> {
  const trace = await page.locator('#validation-trigger-trace').textContent();
  return JSON.parse(trace ?? '');
}

async function runAction(page: Page, name: string) {
  // A programmatic model operation should not change the focused control.
  await page.locator('#' + name).dispatchEvent('click');
}

async function afterFrame(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function checkStage(page: Page, stage: Stage, expected: Trace = observation.cases[stage]) {
  await afterFrame(page);
  await expect.poll(() => readTrace(page), { message: stage }).toEqual(expected);
  await runAction(page, 'clear-trace');
}

test('Form inherits and overrides validation triggers, including custom and explicit checks', async ({ page }) => {
  await openFixture(page);
  await checkStage(page, 'initial');
  const inherited = page.locator('#inherited');
  await inherited.focus();
  await inherited.blur();
  await checkStage(page, 'untouchedBlur');
  await inherited.fill('new');
  await checkStage(page, 'inheritedChange');
  await inherited.blur();
  await checkStage(page, 'inheritedBlur');

  const both = page.locator('#both');
  await both.fill('two');
  await checkStage(page, 'overrideChange');
  await both.blur();
  await checkStage(page, 'overrideBlur');

  const disabled = page.locator('#disabled');
  await disabled.fill('disabled');
  await disabled.blur();
  await checkStage(page, 'disabledAutomatic');
  await page.locator('#unmatched').fill('skip');
  await checkStage(page, 'filteredOut');

  await runAction(page, 'pick');
  await checkStage(page, 'customValue');
  await runAction(page, 'custom-check');
  await checkStage(page, 'customValidation');

  await runAction(page, 'add-trigger-row');
  await checkStage(page, 'listInherited');
  await runAction(page, 'change-trigger');
  await inherited.fill('changed default');
  await checkStage(page, 'reactiveTrigger');
  await runAction(page, 'add-trigger-row');
  await checkStage(page, 'listChangeTrigger');

  await runAction(page, 'manual-check');
  await checkStage(page, 'manual');
});

test('Form discards blur validation when the control handler writes a newer value', async ({ page }) => {
  await openFixture(page);
  const input = page.locator('#write');
  await input.focus();
  await input.blur();

  expect(observation.blurWrite).toEqual({
    value: 'from blur handler', errors: ['Stale blur error']
  });
  await expect(input).toHaveValue(observation.blurWrite.value);
  await checkStage(page, 'writeDuringBlur', observation.cases.writeDuringBlur.slice(0, 2));
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#blur-write-errors')).toHaveText('[]');
});

test('Form dependencies use dirty fields and current rules in validation and change events', async ({ page }) => {
  await openFixture(page);
  const source = page.locator('#source');
  await source.fill('next');
  await checkStage(page, 'dependencies');
  await page.locator('#clean').fill('made dirty');
  await checkStage(page, 'dirtyField');
  await source.fill('again');
  await checkStage(page, 'dirtyChain');

  await runAction(page, 'programmatic-writes');
  await expect(source).toHaveValue('set metadata');
  await checkStage(page, 'silentWrites');
  await runAction(page, 'rebind-dependencies');
  await page.locator('#alternate').fill('connected');
  await checkStage(page, 'reactiveDependency');

  const firstRow = page.locator('#row-0');
  await firstRow.fill('typed first');
  await checkStage(page, 'exactPath');
  await runAction(page, 'move-row');
  await checkStage(page, 'listRoot');
  await page.locator('#row-1').fill('old row');
  await checkStage(page, 'movedPath');
  await firstRow.fill('new row');
  await checkStage(page, 'newPath');
});

test('Form dependencies stop superseded validations in a cycle', async ({ page }) => {
  await openFixture(page);
  await page.locator('#cycleA').fill('cycle change');

  const source = observation.cases.cycle;
  const firstRun = source.findIndex(([kind, name]) => kind === 'rule' && name === 'cycle-a');
  const laterRun = source.findLastIndex(([kind, name]) => kind === 'rule' && name === 'cycle-a');
  expect(laterRun).toBeGreaterThan(firstRun);

  // The control check has already validated A when the dependency frame gets to it again.
  const expected: Trace = source.filter((_, index) => index !== laterRun);
  const completed = expected.at(-1)?.[1];
  if (!Array.isArray(completed)) {
    throw new Error('Dependency completion is missing from the upstream capture');
  }
  expected[expected.length - 1] = ['fields', completed.slice(1)];
  await checkStage(page, 'cycle', expected);
});

test('Form cancels dependency frames on a newer edit, reset, and field removal', async ({ page }) => {
  await openFixture(page);
  const source = page.locator('#source');
  await source.evaluate((input: HTMLInputElement) => {
    for (const value of ['superseded', 'current']) {
      input.value = value;
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  });
  await afterFrame(page);
  let rules = (await readTrace(page)).filter(([kind]) => kind === 'rule');
  expect(rules).toEqual([
    ['rule', 'source', 'current', null],
    ['rule', 'direct', 0, ['initial', 'current']],
    ['rule', 'tail', '', null]
  ]);
  await runAction(page, 'clear-trace');

  await source.evaluate((input: HTMLInputElement) => {
    input.value = 'discarded by reset';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    document.getElementById('reset-dependencies')?.click();
  });
  await afterFrame(page);
  await expect(source).toHaveValue('start');
  await expect(page.locator('#dependency-pending')).toHaveText('false');
  rules = (await readTrace(page)).filter(([kind]) => kind === 'rule');
  expect(rules).toEqual([]);
  await runAction(page, 'clear-trace');

  await source.evaluate((input: HTMLInputElement) => {
    input.value = 'dependent removed';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    document.getElementById('remove-dependent')?.click();
  });
  await expect(page.locator('#direct')).toHaveCount(0);
  await afterFrame(page);
  rules = (await readTrace(page)).filter(([kind]) => kind === 'rule');
  expect(rules).toEqual([['rule', 'source', 'dependent removed', null], ['rule', 'tail', '', null]]);
});
