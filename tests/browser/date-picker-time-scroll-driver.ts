// Performs time column scrolling scenarios through real input Playwright. The pictures distinguish
// the position before the gesture, after the wheel and after the removal of the component.
import assert from 'node:assert/strict';
import type { Locator, Page } from '@playwright/test';
import type { ScrollAction, ScrollSample } from './date-picker-time-scroll-native-types';
import { readNativeTimeScroll } from './date-picker-time-scroll-metrics.mjs';

// Removes the metrics in browser realm together with column identifiers.
export const readTimeScroll = (page: Page) => page.evaluate(readNativeTimeScroll);

// Skips two frames and gives a short delayed scroll.
export function drainTimeScroll(page: Page) {
  return page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => setTimeout(resolve, 25));
  })));
}

// He considers the condition to be stable after four identical repeated shots.
export async function settleTimeScroll(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 70; attempt++) {
    await drainTimeScroll(page);
    const actual = await readTimeScroll(page);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 4) {
      return actual;
    }
    previous = encoded;
  }
  throw Error('Actual compact Native scroll owner did not settle');
}

// Configures viewport and removes the pointer from the column to the first dimension.
export async function openTimeScroll(page: Page, sample: ScrollSample) {
  await page.setViewportSize(sample.viewport);
  await page.goto('/date-picker-time-scroll.html?sample=' + encodeURIComponent(sample.id));
  await page.waitForFunction(() => window.nativeTimeScroll?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1100, 750);
}

// Marks a step in the log and sends the required action to the realm browser.
export async function actTimeScroll(page: Page, action: ScrollAction, index: number) {
  await page.evaluate(index => window.nativeTimeScroll.setActionIndex(index), index);
  if (action.type === 'input-open') {
    await page.locator('#scroll-picker-input').click();
    return null;
  }
  if (action.type !== 'wheel-to-top') {
    return page.evaluate(action => {
      if (!('value' in action)) {
        throw Error('Authored owner action value is absent');
      }
      return window.nativeTimeScroll.activateOwnerControl(
        action.type.replace('owner-', ''), action.value
      );
    }, action);
  }
  const column = page.locator('.ant-picker-dropdown:visible '
    + 'ul.ant-picker-time-panel-column[aria-label="' + action.column + '"]');
  const before = await measureWheelColumn(column);
  await recordNextWheel(column);

  const bounds = await column.boundingBox();
  assert(bounds && bounds.width > 0 && bounds.height > 0, 'Real wheel needs visible column');
  const pointer = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + Math.min(12, bounds.height / 2)
  };
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.wheel(0, action.deltaY);
  await drainTimeScroll(page);
  const afterWheel = await column.evaluate(node => ({
    scrollTop: node.scrollTop,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight
  }));
  await page.mouse.move(1100, 750);

  const observed = await page.evaluate(index => window.nativeTimeScrollObservation.wheels.filter(
    wheel => typeof wheel === 'object' && wheel !== null
      && 'actionIndex' in wheel && wheel.actionIndex === index
  ), index);
  assert.equal(observed.length, 1, 'Exactly one actually dispatched trusted wheel');
  assert.equal(afterWheel.scrollTop, 0, 'No scrollTop assignment fallback is allowed');
  return { before, pointer, observed, afterWheel, pointerLeftTo: { x: 1100, y: 750 } };
}

// Reminds the starting position and identity of the column before the gesture.
function measureWheelColumn(column: Locator) {
  return column.evaluate(node => ({
    scrollTop: node.scrollTop,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
    identity: window.nativeTimeScroll.getRecorder().identity(node)
  }));
}

// Intercepts the single actual wheel event across both DOM targets.
function recordNextWheel(column: Locator) {
  return column.evaluate(node => {
    // Writes the original event data prior to the removal of a one-time listener.
    node.addEventListener('wheel', event => {
      const wheel = event as WheelEvent;
      if (wheel.target === null || wheel.currentTarget === null) {
        throw Error('Actual wheel targets are unavailable');
      }
      window.nativeTimeScrollObservation.wheels.push({
        actionIndex: window.nativeTimeScroll.read().actionIndex,
        type: wheel.type,
        isTrusted: wheel.isTrusted,
        deltaX: wheel.deltaX,
        deltaY: wheel.deltaY,
        deltaMode: wheel.deltaMode,
        timeStamp: wheel.timeStamp,
        targetIdentity: window.nativeTimeScroll.getRecorder().identity(wheel.target),
        currentTargetIdentity: window.nativeTimeScroll.getRecorder().identity(wheel.currentTarget),
        currentTargetTag: wheel.currentTarget instanceof Element ? wheel.currentTarget.tagName : null
      });
    }, { once: true, capture: true, passive: true });
  });
}

// Removes the status to unmount, after cleanup and after a second to check late effects.
export async function disposeTimeScroll(page: Page) {
  const trace: string[] = [];
  const beforeUnmount = await readTimeScroll(page);
  trace.push('beforeUnmount-read');
  trace.push('dispose-start');
  await page.evaluate(() => window.nativeTimeScroll.dispose());
  trace.push('dispose-finished');
  await drainTimeScroll(page);
  const cleanup = await readTimeScroll(page);
  trace.push('cleanup-read');
  await page.waitForTimeout(1000);
  const late = await readTimeScroll(page);
  trace.push('late-1000-read');
  return { beforeUnmount, cleanup, late, trace };
}
