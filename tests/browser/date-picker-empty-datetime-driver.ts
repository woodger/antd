import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import type { EmptyDatetimeAction } from './date-picker-empty-datetime-cases.mjs';
import type { EmptyDatetimeOwner } from './date-picker-empty-datetime-native-types';
import { readNativeEmptyDatetime } from './date-picker-empty-datetime-metrics.mjs';
import { readNativeEmptyDatetimePoint, type NativeEmptyDatetimePoint }
  from './date-picker-empty-datetime-assertions';

export async function readEmptyDatetime(page: Page) {
  return readNativeEmptyDatetimePoint(await page.evaluate(readNativeEmptyDatetime));
}

async function drainEmptyDatetime(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => setTimeout(resolve, 25));
  })));
}

export async function settleEmptyDatetime(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 70; attempt++) {
    await drainEmptyDatetime(page);
    const actual = await readEmptyDatetime(page);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 4) return actual;
    previous = encoded;
  }
  throw Error('Actual complete empty datetime owner did not settle');
}

export async function openEmptyDatetime(page: Page, sample: { id: EmptyDatetimeOwner }) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-empty-datetime.html?owner=' + sample.id);
  await page.waitForFunction(() => window.nativeEmptyDatetime?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1100, 750);
}

export async function actEmptyDatetime(page: Page, action: EmptyDatetimeAction, index: number) {
  await page.evaluate(index => window.nativeEmptyDatetime.setActionIndex(index), index);
  const before = await readEmptyDatetime(page);
  const popup = page.locator('[data-picker-popup]:visible');
  const target = action.type.startsWith('input-') ? page.locator('#empty-datetime-input')
    : 'value' in action && action.type.startsWith('date-')
      ? popup.locator('.ant-picker-date-panel td[title="' + action.value + '"] button')
      : 'value' in action && action.type.startsWith('hour-')
        ? popup.locator('ul[aria-label="hour"] button[aria-label="hour ' + action.value + '"]')
        : page.locator('[data-empty-datetime-control="template"]');
  assert.equal(await target.count(), 1, 'Exactly one real public action target');
  const evidence: { targetBefore: unknown; afterFocusPointer?: NativeEmptyDatetimePoint;
    ownerClick?: unknown } = { targetBefore: await target.evaluate(node => ({
      identity: window.nativeEmptyDatetime.getRecorder().identity(node), tag: node.tagName,
      attributes: [...node.attributes].map(item => [item.name, item.value]), html: node.outerHTML,
      focused: node === document.activeElement
    })) };
  if (action.type.endsWith('-hover')) await target.hover();
  else if (action.type === 'input-escape') {
    await target.click();
    evidence.afterFocusPointer = await readEmptyDatetime(page);
    await page.keyboard.press('Escape');
  } else if (action.type === 'template-button') {
    evidence.ownerClick = await page.evaluate(() => window.nativeEmptyDatetime.activateTemplate());
  } else await target.click();
  // Не перемещаем указатель: реальный scroll колонки меняет settled hover после hour12.
  return { action, before, evidence, afterCall: await readEmptyDatetime(page) };
}

export async function disposeEmptyDatetime(page: Page, hooks?: {
  afterCleanup?: (point: NativeEmptyDatetimePoint) => void | Promise<void>;
  afterLate?: (point: NativeEmptyDatetimePoint) => void | Promise<void>;
}) {
  const trace: string[] = [];
  const beforeUnmount = await readEmptyDatetime(page);
  trace.push('beforeUnmount-read');
  trace.push('dispose-start');
  await page.evaluate(() => window.nativeEmptyDatetime.dispose());
  trace.push('dispose-finished');
  await drainEmptyDatetime(page);
  const cleanup = await readEmptyDatetime(page);
  trace.push('cleanup-read');
  await hooks?.afterCleanup?.(cleanup);
  await page.waitForTimeout(1000);
  const late = await readEmptyDatetime(page);
  trace.push('late-1000-read');
  await hooks?.afterLate?.(late);
  await page.evaluate(() => window.nativeEmptyDatetime.stopEventObserver());
  return { beforeUnmount, cleanup, late, trace };
}
