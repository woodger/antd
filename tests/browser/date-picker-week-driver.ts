import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import type { WeekSample, WeekAction } from './date-picker-week-cases.mjs';
import { readNativeWeek, readNativeWeekProducers }
  from './date-picker-week-metrics.mjs';
import { readNativeWeekPoint, type NativeWeekPoint }
  from './date-picker-week-assertions';

export async function readWeek(page: Page) {
  return readNativeWeekPoint(await page.evaluate(readNativeWeek));
}
export const readWeekProducers = (page: Page, cursor: number) =>
  page.evaluate(readNativeWeekProducers, cursor);
async function drainWeek(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => setTimeout(resolve, 25));
  })));
}
export async function settleWeek(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 70; attempt++) {
    await drainWeek(page);
    const actual = await readWeek(page);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 4) {
      return actual;
    }
    previous = encoded;
  }
  throw Error('Complete Native week observation did not settle');
}
export async function openWeek(page: Page, sample: WeekSample) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-week.html?owner=' + sample.id);
  await page.waitForFunction(() => window.nativeWeek?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1200, 800);
}
export async function actWeek(page: Page, action: WeekAction, index: number) {
  await page.evaluate(index => window.nativeWeek.setActionIndex(index), index);
  const before = await readWeek(page);
  const popup = page.locator('[data-picker-popup]:visible');
  const panel = popup.locator('.ant-picker-panel').nth('panel' in action ? action.panel : 0);
  const exactText = (value: string) => new RegExp('^'
    + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
  let target;
  if (action.type === 'input-open' || action.type === 'input-type'
    || action.type === 'input-escape') {
    target = page.locator(action.index === 1 ? '#week-end' : '#week-input');
  }
  else if (action.type === 'input-key') target = page.locator('.ant-picker input:focus');
  else if (action.type === 'owner-control') {
    target = page.locator('[data-week-control="' + action.value + '"]');
  }
  else if (action.type === 'header-promote') {
    target = panel.locator('.ant-picker-header-view .ant-picker-year-btn');
  }
  else if (action.type === 'header-next-month') {
    target = popup.locator('.ant-picker-header-next-btn:visible').last();
  }
  else if (action.type === 'upper-cell-click') {
    target = panel.locator('td[title="' + action.title + '"] button');
  }
  else if (action.type === 'cell-click' || action.type === 'cell-hover') {
    target = panel.locator('td[title="' + action.title + '"] button');
  }
  else if (action.type === 'week-number-click') {
    target = panel.locator('tbody tr').filter({
      has: page.locator('td[title="' + action.contains + '"]')
    }).locator('td.ant-picker-cell-week');
  }
  else if (action.type === 'pointer-leave') {
    target = page.locator('[data-week-owner]');
  }
  else if (action.type === 'confirm-click') target = popup.locator('.ant-picker-ok button');
  else if (action.type === 'preset-click') {
    target = popup.locator('.ant-picker-presets button').filter({ hasText: exactText(action.label) });
  }
  else throw Error('Unknown declared week action');
  assert.equal(await target.count(), 1, 'Exactly one actual public action target');
  const actionEvidence: { targetBefore: unknown; afterFocusPointer?: NativeWeekPoint;
    ownerClick?: unknown; actualCoordinates?: { x: number; y: number }; hitBefore?: unknown } = {
      targetBefore: await target.evaluate(node => ({
        identity: window.nativeWeek.getRecorder().identity(node), tag: node.tagName,
        attributes: [...node.attributes].map(item => [item.name, item.value]), html: node.outerHTML,
        focused: node === document.activeElement,
        disabled: 'disabled' in node ? node.disabled : null,
        cellDisabledClass: node.closest('td')?.classList.contains('ant-picker-cell-disabled') ?? false
      }))
    };
  if (action.type === 'owner-control') {
    actionEvidence.ownerClick = await page.evaluate(value =>
      window.nativeWeek.activateControl(value), action.value);
  }
  else if (action.type === 'input-escape') {
    await target.click();
    actionEvidence.afterFocusPointer = await readWeek(page);
    await page.keyboard.press('Escape');
  }
  else if (action.type === 'input-type') {
    await target.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(action.value);
  }
  else if (action.type === 'input-key') await page.keyboard.press(action.value);
  else if (action.type === 'cell-hover') await target.hover();
  else if (action.type === 'pointer-leave') {
    actionEvidence.actualCoordinates = { x: 1200, y: 800 };
    await page.mouse.move(1200, 800);
  }
  else if (action.type !== 'input-open') {
    const box = await target.boundingBox();
    assert(box && box.width > 0 && box.height > 0, 'Real visible target geometry required');
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    actionEvidence.actualCoordinates = point;
    actionEvidence.hitBefore = await target.evaluate((node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);
      return { identity: hit == null ? null : window.nativeWeek.getRecorder().identity(hit),
        tag: hit?.tagName ?? null, targetContainsHit: hit != null && node.contains(hit),
        attributes: hit ? [...hit.attributes].map(item => [item.name, item.value]) : null };
    }, point);
    // Настоящий mouse click допускает disabled target; force/снятие disabled не используются.
    await page.mouse.click(point.x, point.y);
  }
  else await target.click();
  return { index, action, before, actionEvidence, afterCall: await readWeek(page) };
}
export async function disposeWeek(page: Page, hooks?: {
  beforeUnmount?: (point: NativeWeekPoint) => void | Promise<void>;
  afterCleanup?: (point: NativeWeekPoint) => void | Promise<void>;
  afterLate?: (point: NativeWeekPoint) => void | Promise<void>;
}) {
  const trace: string[] = [];
  const beforeUnmount = await readWeek(page);
  trace.push('beforeUnmount-read');
  await hooks?.beforeUnmount?.(beforeUnmount);
  trace.push('dispose-start');
  await page.evaluate(() => window.nativeWeek.dispose());
  trace.push('dispose-finished');
  await drainWeek(page);
  const cleanup = await readWeek(page);
  trace.push('cleanup-read');
  await hooks?.afterCleanup?.(cleanup);
  await page.waitForTimeout(1000);
  const late = await readWeek(page);
  trace.push('late-1000-read');
  await hooks?.afterLate?.(late);
  await page.evaluate(() => window.nativeWeek.stopEventObserver());
  return { beforeUnmount, cleanup, late, trace };
}
