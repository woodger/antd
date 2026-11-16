import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-popup-width-height-reference.json' with { type: 'json' };
import type { PopupWidthAction } from './fixtures/popup-width-cases';
import { actPopupWidth, drainPopupWidth, preparePopupWidth } from './popup-width-driver';
import { readPopupWidth } from './popup-width-metrics';

function readHeight() {
  const popup = [...document.querySelectorAll<HTMLElement>('.ant-select-dropdown')]
    .find(node => !node.hidden && getComputedStyle(node).display !== 'none'
      && getComputedStyle(node).visibility !== 'hidden');
  if (!popup) return null;
  const css = getComputedStyle(popup);
  const box = popup.getBoundingClientRect();
  const holder = popup.querySelector<HTMLElement>('[class$="-list-holder"]');
  return {
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    clientHeight: popup.clientHeight, scrollHeight: popup.scrollHeight,
    css: Object.fromEntries([
      'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
      'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'boxSizing'
    ].map(key => [key, css[key as keyof CSSStyleDeclaration]])),
    contentViewportHeight: popup.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom),
    holderHeight: holder?.clientHeight ?? null,
    inlineStyle: popup.getAttribute('style')
  };
}

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await drainPopupWidth(page);
    const actual = { projection: await page.evaluate(readPopupWidth), height: await page.evaluate(readHeight) };
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Public popup height did not settle');
}

test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  expect(createHash('sha256').update(readFileSync(new URL(
    './fixtures/ant-design-popup-width-height-reference.json', import.meta.url
  ))).digest('hex')).toBe('730cea7a75ea51638cf47c9ab5ce29b4a35db74da862a74b189625b6e4f81f0a');
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings).toEqual([]);
  expect(reference.cases).toHaveLength(8);
});

for (const entry of reference.cases) {
  test(`list viewport preserves Source height for ${entry.id}`, async ({ page }, testInfo) => {
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
      if (entry.publicCss) await page.addStyleTag({ content: entry.publicCss });
      await preparePopupWidth(page);
      captures.push(await settle(page));
      expect(captures[0].projection.view).toEqual(entry.initial.view);
      for (const step of entry.steps) {
        await actPopupWidth(page, step.action as PopupWidthAction);
        const actual = await settle(page);
        captures.push(actual);
        expect(actual.projection.view, JSON.stringify(step.action)).toEqual(step.view);
        if (step.height.popup) {
          expect(actual.height).not.toBeNull();
          expect(actual.height!.box.height, 'actual Source outer popup height').toBe(step.height.popup.box.height);
          expect(actual.height!.css, 'actual public physical padding/border and box sizing')
            .toEqual(Object.fromEntries(Object.keys(actual.height!.css)
              .map(key => [key, step.height.popup!.css[key as keyof typeof step.height.popup.css]])));
          expect(actual.height!.holderHeight, 'actual scroll viewport matches Source inner holder')
            .toBe(step.height.holders[0].clientHeight);
        } else expect(actual.height).toBeNull();
        expect(actual.projection.view.leaks).toEqual([]);
      }
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    } finally {
      await testInfo.attach(`${entry.id}-actual`, {
        body: JSON.stringify({ scope: 'Actual outer height, physical public CSS and inner scroll viewport. Native and Source DOM remain independent raw evidence.',
          captures, errors, warnings }, null, 2), contentType: 'application/json'
      });
    }
  });
}
