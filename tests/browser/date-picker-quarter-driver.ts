import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import type { QuarterSample, QuarterAction } from './date-picker-quarter-cases.mjs';
import { readNativeQuarter, readNativeQuarterProducers }
  from './date-picker-quarter-metrics.mjs';
import { readNativeQuarterPoint, type NativeQuarterPoint }
  from './date-picker-quarter-assertions';

export async function readQuarter(page: Page) {
  return readNativeQuarterPoint(await page.evaluate(readNativeQuarter));
}
export const readQuarterProducers = (page: Page, cursor: number) =>
  page.evaluate(readNativeQuarterProducers, cursor);
async function drainQuarter(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => setTimeout(resolve, 25));
  })));
}
export async function settleQuarter(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 70; attempt++) {
    await drainQuarter(page);
    const actual = await readQuarter(page);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 4) {
      return actual;
    }
    previous = encoded;
  }
  throw Error('Complete Native quarter observation did not settle');
}
export async function openQuarter(page: Page, sample: QuarterSample) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-quarter.html?owner=' + sample.id);
  await page.waitForFunction(() => window.nativeQuarter?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1200, 800);
}
export async function actQuarter(page: Page, action: QuarterAction, index: number) {
  await page.evaluate(index => window.nativeQuarter.setActionIndex(index), index);
  const before = await readQuarter(page);
  const popup = page.locator('[data-picker-popup]:visible');
  const exactText = (value: string) => new RegExp('^'
    + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
  let target;
  if (action.type === 'input-open' || action.type === 'input-type'
    || action.type === 'input-escape') {
    target = page.locator(action.index === 1 ? '#quarter-end' : '#quarter-input');
  }
  else if (action.type === 'input-key') target = page.locator('.ant-picker input:focus');
  else if (action.type === 'owner-control') {
    target = page.locator('[data-quarter-control="' + action.value + '"]');
  }
  else if (action.type === 'header-promote') {
    target = popup.locator('.ant-picker-header-view button').first();
  }
  else if (action.type === 'header-next') {
    target = popup.locator('.ant-picker-header-super-next-btn:visible').last();
  }
  else if (action.type === 'upper-cell-click') {
    target = popup.locator('td').filter({ has: page.locator('.ant-picker-cell-inner', {
      hasText: exactText(action.value)
    }) }).locator('button');
  }
  else if (action.type === 'cell-click') {
    target = popup.locator('td[title="' + action.title + '"] button');
  }
  else if (action.type === 'confirm-click') target = popup.locator('.ant-picker-ok button');
  else if (action.type === 'preset-click') {
    target = popup.locator('.ant-picker-presets button').filter({ hasText: exactText(action.label) });
  }
  else throw Error('Unknown declared quarter action');
  assert.equal(await target.count(), 1, 'Exactly one actual public action target');
  const actionEvidence: { targetBefore: unknown; afterFocusPointer?: NativeQuarterPoint;
    ownerClick?: unknown; actualCoordinates?: { x: number; y: number }; hitBefore?: unknown } = {
      targetBefore: await target.evaluate(node => ({
        identity: window.nativeQuarter.getRecorder().identity(node), tag: node.tagName,
        attributes: [...node.attributes].map(item => [item.name, item.value]), html: node.outerHTML,
        focused: node === document.activeElement,
        disabled: 'disabled' in node ? node.disabled : null,
        cellDisabledClass: node.closest('td')?.classList.contains('ant-picker-cell-disabled') ?? false
      }))
    };
  if (action.type === 'owner-control') {
    actionEvidence.ownerClick = await page.evaluate(value =>
      window.nativeQuarter.activateControl(value), action.value);
  }
  else if (action.type === 'input-escape') {
    await target.click();
    actionEvidence.afterFocusPointer = await readQuarter(page);
    await page.keyboard.press('Escape');
  }
  else if (action.type === 'input-type') {
    await target.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(action.value);
  }
  else if (action.type === 'input-key') await page.keyboard.press(action.value);
  else if (action.type !== 'input-open') {
    const box = await target.boundingBox();
    assert(box && box.width > 0 && box.height > 0, 'Real visible target geometry required');
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    actionEvidence.actualCoordinates = point;
    actionEvidence.hitBefore = await target.evaluate((node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);
      return { identity: hit == null ? null : window.nativeQuarter.getRecorder().identity(hit),
        tag: hit?.tagName ?? null, targetContainsHit: hit != null && node.contains(hit),
        attributes: hit ? [...hit.attributes].map(item => [item.name, item.value]) : null };
    }, point);
    // Настоящий mouse click допускает disabled target; force/снятие disabled не используются.
    await page.mouse.click(point.x, point.y);
  }
  else await target.click();
  return { index, action, before, actionEvidence, afterCall: await readQuarter(page) };
}
export async function disposeQuarter(page: Page, hooks?: {
  beforeUnmount?: (point: NativeQuarterPoint) => void | Promise<void>;
  afterCleanup?: (point: NativeQuarterPoint) => void | Promise<void>;
  afterLate?: (point: NativeQuarterPoint) => void | Promise<void>;
}) {
  const trace: string[] = [];
  const beforeUnmount = await readQuarter(page);
  trace.push('beforeUnmount-read');
  await hooks?.beforeUnmount?.(beforeUnmount);
  trace.push('dispose-start');
  await page.evaluate(() => window.nativeQuarter.dispose());
  trace.push('dispose-finished');
  await drainQuarter(page);
  const cleanup = await readQuarter(page);
  trace.push('cleanup-read');
  await hooks?.afterCleanup?.(cleanup);
  await page.waitForTimeout(1000);
  const late = await readQuarter(page);
  trace.push('late-1000-read');
  await hooks?.afterLate?.(late);
  await page.evaluate(() => window.nativeQuarter.stopEventObserver());
  return { beforeUnmount, cleanup, late, trace };
}
