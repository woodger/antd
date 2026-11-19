import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import type { DateWeekPrefixSample, DateWeekPrefixAction }
  from './date-picker-date-week-prefix-cases.mjs';
import { readNativeDateWeekPrefix, readNativeDateWeekPrefixProducers }
  from './date-picker-date-week-prefix-metrics.mjs';
import { readNativeDateWeekPrefixPoint, type NativeDateWeekPrefixPoint }
  from './date-picker-date-week-prefix-assertions';

export async function readDateWeekPrefix(page: Page) {
  return readNativeDateWeekPrefixPoint(await page.evaluate(readNativeDateWeekPrefix));
}
export const readDateWeekPrefixProducers = (page: Page, cursor: number) =>
  page.evaluate(readNativeDateWeekPrefixProducers, cursor);
async function drainDateWeekPrefix(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => setTimeout(resolve, 25));
  })));
}
export async function settleDateWeekPrefix(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 70; attempt++) {
    await drainDateWeekPrefix(page);
    const actual = await readDateWeekPrefix(page);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 4) return actual;
    previous = encoded;
  }
  throw Error('Complete Native date week-prefix observation did not settle');
}
export async function openDateWeekPrefix(page: Page, sample: DateWeekPrefixSample) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-date-week-prefix.html?owner=' + sample.id);
  await page.waitForFunction(() => window.nativeDateWeekPrefix?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1200, 800);
}
export async function actDateWeekPrefix(page: Page, action: DateWeekPrefixAction, index: number) {
  await page.evaluate(index => window.nativeDateWeekPrefix.setActionIndex(index), index);
  const before = await readDateWeekPrefix(page);
  const popup = page.locator('[data-picker-popup]:visible');
  const panel = popup.locator('.ant-picker-panel').nth('panel' in action ? action.panel : 0);
  let target;
  if (action.type === 'input-open' || action.type === 'input-escape') {
    target = page.locator(action.index === 1 ? '#week-end' : '#week-input');
  } else if (action.type === 'owner-control') {
    target = page.locator('[data-week-control="' + action.value + '"]');
  } else if (action.type === 'cell-click') {
    target = panel.locator('td[title="' + action.title + '"] button');
  } else if (action.type === 'week-number-hover' || action.type === 'week-number-click') {
    target = panel.locator('tbody tr').filter({
      has: page.locator('td[title="' + action.contains + '"]')
    }).locator('td.ant-picker-cell-week');
  } else throw Error('Unknown declared date week-prefix action');
  assert.equal(await target.count(), 1, 'Exactly one actual public action target');
  const actionEvidence: { targetBefore: unknown; afterFocusPointer?: NativeDateWeekPrefixPoint;
    ownerClick?: unknown; actualCoordinates?: { x: number; y: number }; hitBefore?: unknown } = {
      targetBefore: await target.evaluate(node => ({
        identity: window.nativeDateWeekPrefix.getRecorder().identity(node), tag: node.tagName,
        attributes: [...node.attributes].map(item => [item.name, item.value]), html: node.outerHTML,
        focused: node === document.activeElement,
        disabled: 'disabled' in node ? node.disabled : null,
        cellDisabledClass: node.closest('td')?.classList.contains('ant-picker-cell-disabled') ?? false
      }))
    };
  if (action.type === 'owner-control') {
    actionEvidence.ownerClick = await page.evaluate(value =>
      window.nativeDateWeekPrefix.activateControl(value), action.value);
  } else if (action.type === 'input-escape') {
    await target.click();
    actionEvidence.afterFocusPointer = await readDateWeekPrefix(page);
    await page.keyboard.press('Escape');
  } else if (action.type === 'week-number-hover') await target.hover();
  else if (action.type === 'cell-click' || action.type === 'week-number-click') {
    const box = await target.boundingBox();
    assert(box && box.width > 0 && box.height > 0, 'Real visible target geometry required');
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    actionEvidence.actualCoordinates = point;
    actionEvidence.hitBefore = await target.evaluate((node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);
      return { identity: hit == null ? null : window.nativeDateWeekPrefix.getRecorder().identity(hit),
        tag: hit?.tagName ?? null, targetContainsHit: hit != null && node.contains(hit),
        attributes: hit ? [...hit.attributes].map(item => [item.name, item.value]) : null };
    }, point);
    await page.mouse.click(point.x, point.y);
  } else await target.click();
  return { index, action, before, actionEvidence, afterCall: await readDateWeekPrefix(page) };
}
export async function disposeDateWeekPrefix(page: Page, hooks?: {
  beforeUnmount?: (point: NativeDateWeekPrefixPoint) => void | Promise<void>;
  afterCleanup?: (point: NativeDateWeekPrefixPoint) => void | Promise<void>;
  afterLate?: (point: NativeDateWeekPrefixPoint) => void | Promise<void>;
}) {
  const trace: string[] = [];
  const beforeUnmount = await readDateWeekPrefix(page);
  trace.push('beforeUnmount-read');
  await hooks?.beforeUnmount?.(beforeUnmount);
  trace.push('dispose-start');
  await page.evaluate(() => window.nativeDateWeekPrefix.dispose());
  trace.push('dispose-finished');
  await drainDateWeekPrefix(page);
  const cleanup = await readDateWeekPrefix(page);
  trace.push('cleanup-read');
  await hooks?.afterCleanup?.(cleanup);
  await page.waitForTimeout(1000);
  const late = await readDateWeekPrefix(page);
  trace.push('late-1000-read');
  await hooks?.afterLate?.(late);
  await page.evaluate(() => window.nativeDateWeekPrefix.stopEventObserver());
  return { beforeUnmount, cleanup, late, trace };
}
