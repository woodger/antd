import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-context-actions-observation.json' with { type: 'json' };

async function readState(page: Page) {
  return JSON.parse(await page.locator('#context-actions-state').innerText());
}

async function press(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}

const contextButtons: Readonly<Record<string, string>> = {
  context: 'Submit from context', render: 'Submit from render',
  item: 'Submit from item', provider: 'Submit from provider'
};

test('mounted refs submit from the nearest context and both render snippets and the provider', async ({ page }) => {
  await page.goto('/?fixture=form-context-actions');
  await expect.poll(() => readState(page)).toMatchObject({ bound: true, outside: false });
  await expect(page.locator('#render-context')).toHaveText('{"sameModel":true,"sameRef":true}');
  await expect(page.locator('#item-context')).toHaveText('{"sameModel":true,"sameRef":true}');

  const trace: unknown[][] = [];
  const submissions: unknown[] = [];
  for (const sample of observation.submits) {
    const title = contextButtons[sample.id];
    if (!title) {
      throw new Error('Unknown submit path: ' + sample.id);
    }
    await press(page, title);
    trace.push(...sample.events);
    if (!sample.directClick) {
      submissions.push({
        source: sample.id, sameModel: sample.sameModel, sameRef: true, returnType: sample.returnType
      });
    }
    await expect.poll(() => readState(page)).toMatchObject({
      requests: submissions, finishes: trace, registeredModel: 'owner', registeredRef: 'owner',
      onlyNamedRefs: true
    });
  }

  await press(page, 'Edit watched field');

  await expect.poll(() => readState(page)).toMatchObject({ sameChangeRef: true, sameChangeModel: true });
});

test('contextual refs submit a frozen structural model with its own receiver and retain callback overloads', async ({ page }) => {
  await page.goto('/?fixture=form-context-actions');
  await press(page, 'Read registry');
  await expect.poll(() => readState(page)).toMatchObject({ registeredModel: 'owner', registeredRef: 'owner' });
  await press(page, 'Remember owner');
  await press(page, 'Use external model');

  await expect.poll(() => readState(page)).toMatchObject({
    retainedMatches: true, snapshotModel: 'original', snapshotRef: true, retainedHost: null
  });
  await expect(page.locator('#render-context')).toHaveText('{"sameModel":true,"sameRef":true}');
  await expect(page.locator('#item-context')).toHaveText('{"sameModel":true,"sameRef":true}');

  await press(page, 'Read registry');
  await expect.poll(() => readState(page)).toMatchObject({ registeredModel: 'owner', registeredRef: 'owner' });
  const events: unknown[] = [];
  for (const [index, title] of Object.values(contextButtons).entries()) {
    await press(page, title);
    events.push(['provider', 'checkout', { name: 'External' }], ['finish', { name: 'External' }]);
    await expect.poll(() => readState(page)).toMatchObject({ externalCalls: index + 1, finishes: events });
  }
  await press(page, 'Submit explicit callback');
  events.push(['explicit', { name: 'External' }], ['result', 'success']);
  await expect.poll(() => readState(page)).toMatchObject({ externalCalls: 5, finishes: events });

  await press(page, 'Detach owner');
  await press(page, 'Read registry');
  await expect.poll(() => readState(page)).toMatchObject({
    bound: false, registeredModel: null, registeredRef: null,
    snapshotModel: 'original', snapshotRef: true
  });
  await press(page, 'Submit remembered owner');

  expect(await readState(page)).toMatchObject({ externalCalls: 5, finishes: events });
});

test('provider restores the previous form model and ref when a duplicate name leaves', async ({ page }) => {
  await page.goto('/?fixture=form-context-actions');
  await press(page, 'Read registry');
  await expect.poll(() => readState(page)).toMatchObject({ registeredModel: 'owner', registeredRef: 'owner' });
  await press(page, 'Remember owner');
  await press(page, 'Toggle duplicate name');
  await press(page, 'Read registry');
  await expect.poll(() => readState(page)).toMatchObject({
    registeredModel: 'shadow', registeredRef: 'shadow', snapshotModel: 'original', snapshotRef: true
  });

  await press(page, 'Submit from provider');
  await expect.poll(() => readState(page)).toMatchObject({
    finishes: [['provider', 'checkout', { name: 'Shadow' }], ['shadow', { name: 'Shadow' }]]
  });
  await press(page, 'Toggle duplicate name');
  await press(page, 'Read registry');

  await expect.poll(() => readState(page)).toMatchObject({ registeredModel: 'owner', registeredRef: 'owner' });
});
