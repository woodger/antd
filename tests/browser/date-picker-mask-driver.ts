// Reproduces physical actions for mask DatePicker. The journal distinguishes the state immediately
// after each step and after stabilizing the page.
import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { expandAction } from './date-picker-mask-cases.mjs';
import type { MaskAction, MaskSample, MaskSubstepCommand } from './date-picker-mask-cases.mjs';
import { readNativeMask, readNativeMaskProducers } from './date-picker-mask-metrics.mjs';
import { readNativeMaskPoint, type NativeMaskPoint } from './date-picker-mask-assertions';

// Converts the browser realm photo after checking its form.
export const readMask = async (page: Page) => {
  const snapshot = await page.evaluate(readNativeMask);
  return readNativeMaskPoint(snapshot);
};

// Reveals events after cursor from the global fixture magazine.
export const readMaskProducers = (page: Page, cursor: number) => page.evaluate(
  readNativeMaskProducers,
  cursor
);
// Allows you to execute two frames and short selection update timers.
async function drainMask(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => setTimeout(resolve, 25));
  })));
}
// There are several consecutive repetitions of the same state.
export async function settleMask(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 70; attempt++) {
    await drainMask(page);
    const actual = await readMask(page);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 4) {
      return actual;
    }
    previous = encoded;
  }
  throw Error('Complete Native mask scoped observation did not settle');
}
// Fixes the date and viewport before downloading each input variation.
export async function openMask(page: Page, sample: MaskSample) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-mask.html?owner=' + sample.id);
  await page.waitForFunction(() => window.nativeMask?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1200, 800);
}
export interface MaskSubstepRead {
  index: number;
  substepIndex: number;
  command: MaskSubstepCommand;
  evidence: unknown;
  before: NativeMaskPoint;
  afterCall: NativeMaskPoint;
  actual: NativeMaskPoint;
}

// Performs physical commands in the order of the script and links the result with the last step.
export async function actMask(
  page: Page,
  action: MaskAction,
  index: number,
  hooks?: {
    beforeMacro?: (point: NativeMaskPoint) => void | Promise<void>;
    beforeSubstep?: (
      point: NativeMaskPoint,
      substepIndex: number,
      command: MaskSubstepCommand
    ) => void | Promise<void>;
    afterSubstep?: (step: MaskSubstepRead) => void | Promise<void>;
  }
) {
  await page.evaluate(index => window.nativeMask.setActionIndex(index), index);
  const before = await readMask(page);
  await hooks?.beforeMacro?.(before);
  let pointer: {
    index: number;
    anchor: string;
    point: { x: number; y: number };
    hitBefore: unknown
  } | null = null;
  let afterCall: NativeMaskPoint | null = null;
  let afterCallSource: { substep: { index: number; substepIndex: number }; field: 'afterCall' } | null = null;
  const substeps: Array<{ index: number; substepIndex: number }> = [];
  for (const [substepIndex, command] of expandAction(action).entries()) {
    await page.evaluate(index => window.nativeMask.setSubstepIndex(index), substepIndex);
    const childBefore = await readMask(page);
    await hooks?.beforeSubstep?.(childBefore, substepIndex, command);
    let evidence: unknown;
    if (command.type === 'mouse-move-input') {
      const target = page.locator(command.index === 1 ? '#mask-end' : '#mask-input');
      assert.equal(await target.count(), 1);
      const geometry = await target.evaluate(readEditorGeometry);
      assert(geometry.width > 0 && geometry.height > 0);
      const offset = command.anchor === 'text-start'
        ? (parseFloat(geometry.css.borderLeftWidth) || 0) + (parseFloat(geometry.css.paddingLeft) || 0)
          + Math.max(0, parseFloat(geometry.css.textIndent) || 0) + 2
        : geometry.width / 2;
      const point = { x: geometry.x + offset, y: geometry.y + geometry.height / 2 };
      const hitBefore = await target.evaluate((node, point) => {
        const hit = document.elementFromPoint(point.x, point.y);
        return { identity: hit == null ? null : window.nativeMask.getRecorder().identity(hit),
          tag: hit?.tagName ?? null, targetContainsHit: hit != null && node.contains(hit),
          attributes: hit ? [...hit.attributes].map(a => [a.name, a.value]) : null };
      }, point);
      assert.equal(
        hitBefore.targetContainsHit,
        true,
        'Authored coordinate must hit the actual input'
      );
      evidence = { geometry, point, hitBefore };
      pointer = { index: command.index, anchor: command.anchor, point, hitBefore };
      await page.mouse.move(point.x, point.y);
    }
    else if (command.type === 'mouse-down') {
      assert(pointer);
      evidence = { pointer };
      await page.mouse.down({ button: command.button });
    }
    else if (command.type === 'mouse-up') {
      assert(pointer);
      evidence = { pointer };
      await page.mouse.up({ button: command.button });
    }
    else if (command.type === 'key-press') {
      const target = page.locator('.ant-picker input:focus');
      assert.equal(await target.count(), 1);
      evidence = { focusedInput: await target.evaluate(node => {
        if (!(node instanceof HTMLInputElement)) {
          throw Error('Actual focused input required');
        }
        return { identity: window.nativeMask.getRecorder().identity(node), attributes: [...node.attributes].map(a => [a.name, a.value]),
          value: node.value, selectionStart: node.selectionStart, selectionEnd: node.selectionEnd,
          selectionDirection: node.selectionDirection };
      }) };
      await page.keyboard.press(command.key);
    }
    else if (command.type === 'owner-control-click') {
      const target = page.locator('[data-mask-control="' + command.value + '"]');
      assert.equal(await target.count(), 1);
      evidence = await page.evaluate(
        value => window.nativeMask.activateControl(value),
        command.value
      );
    }
    else {
      throw Error('Undeclared physical command');
    }
    const immediate = await readMask(page);
    const actual = await settleMask(page);
    const child = {
      index,
      substepIndex,
      command,
      evidence,
      before: childBefore,
      afterCall: immediate,
      actual
    };
    await hooks?.afterSubstep?.(child);
    const reference = { index, substepIndex };
    substeps.push(reference);
    afterCall = immediate;
    afterCallSource = { substep: reference, field: 'afterCall' };
  }
  await page.evaluate(() => window.nativeMask.setSubstepIndex(-1));
  assert(afterCall && afterCallSource);

  const actual = await settleMask(page);
  return { scope: 'macro' as const, index, action, before, substeps, afterCall, afterCallSource, actual };
}

// Removes the coordinates and indentations directly into browser realm for accurate hit-test.
function readEditorGeometry(node: Element) {
  const box = node.getBoundingClientRect();
  const css = getComputedStyle(node);
  return {
    identity: window.nativeMask.getRecorder().identity(node),
    tag: node.tagName,
    html: node.outerHTML,
    attributes: [...node.attributes].map(a => [a.name, a.value]),
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    css: {
      paddingLeft: css.paddingLeft,
      borderLeftWidth: css.borderLeftWidth,
      textIndent: css.textIndent,
      direction: css.direction,
      font: css.font,
      display: css.display
    }
  };
}

// Fix the condition before and after teardown, then removes the observation of the events.
export async function disposeMask(page: Page, hooks?: {
  beforeUnmount?: (point: NativeMaskPoint) => void | Promise<void>;
  afterCleanup?: (point: NativeMaskPoint) => void | Promise<void>;
  afterLate?: (point: NativeMaskPoint) => void | Promise<void>;
}) {
  const trace: string[] = [];
  const beforeUnmount = await readMask(page);
  trace.push('beforeUnmount-read');
  await hooks?.beforeUnmount?.(beforeUnmount);
  trace.push('dispose-start');
  await page.evaluate(() => window.nativeMask.dispose());
  trace.push('dispose-finished');
  await drainMask(page);
  const cleanup = await readMask(page);
  trace.push('cleanup-read');
  await hooks?.afterCleanup?.(cleanup);
  await page.waitForTimeout(1000);
  const late = await readMask(page);
  trace.push('late-1000-read');
  await hooks?.afterLate?.(late);
  await page.evaluate(() => window.nativeMask.stopEventObserver());
  return { beforeUnmount, cleanup, late, trace };
}
