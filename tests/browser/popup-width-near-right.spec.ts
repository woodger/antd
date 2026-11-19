import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-popup-width-near-right-reference.json' with { type: 'json' };
import type { PopupWidthAction } from './fixtures/popup-width-cases';
import { actPopupWidth, drainPopupWidth, preparePopupWidth } from './popup-width-driver';
import { readPopupWidth } from './popup-width-metrics';

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await drainPopupWidth(page);
    const actual = await page.evaluate(readPopupWidth);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Near-right popup width did not settle');
}

test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  expect(createHash('sha256').update(readFileSync(new URL(
    './fixtures/ant-design-popup-width-near-right-reference.json', import.meta.url
  ))).digest('hex')).toBe('d09cf2a987b5e1a9e3631ab5492aaa6d56b105476f63b82d5e2a61be44253a41');
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings).toEqual([]);
  expect(reference.cases).toHaveLength(3);
});

for (const entry of reference.cases) {
  test(`initial width and invalid reopen preserve Source placement for ${entry.id}`, async (
    { page },
    testInfo
  ) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const captures: Awaited<ReturnType<typeof settle>>[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
      else if (message.type() === 'warning') warnings.push(message.text());
    });
    try {
      await page.goto('/?fixture=popup-width');
      await page.getByRole('combobox', { name: 'Popup width sample', exact: true })
        .selectOption(entry.sourceSampleId);
      await expect(page.locator('[data-width-case]')).toHaveAttribute('data-width-bound', 'true');
      await page.addStyleTag({ content: entry.publicCss });
      await preparePopupWidth(page);
      const initial = await settle(page);
      captures.push(initial);
      expect(initial.view).toEqual(entry.initial.view);
      for (const step of entry.steps) {
        await actPopupWidth(page, step.action as PopupWidthAction);
        const actual = await settle(page);
        captures.push(actual);
        expect(actual.view, JSON.stringify(step.action)).toEqual(step.view);
      }
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      await testInfo.attach(`${entry.id}-actual`, {
        body: JSON.stringify({ captures, errors, warnings }, null, 2), contentType: 'application/json'
      });
    }
  });
}
