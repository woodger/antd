import type { Page } from '@playwright/test';
import { drainSelectSurface } from './select-surface-driver';
import { readDatePickerPresetTransitions as readSharedTransitions } from './date-picker-preset-transitions-metrics.mjs';
import { readDatePickerPresetsCleanup as readSharedCleanup } from './date-picker-preset-transitions-read-core.mjs';
import type {
  DatePickerPresetTransitionPoint as Point,
  DatePickerPresetTransitionCleanup as Cleanup,
  DatePickerPresetTransitionSample as Sample,
  DatePickerPresetTransitionAction as Action
} from './date-picker-preset-transitions-native-types';

// These are the unchanged shared reader function objects, typed for the ordinary
// Native owner at the bridge; page.evaluate receives their actual frozen bodies.
const readDatePickerPresetTransitions = readSharedTransitions as unknown as () => Point;
const readDatePickerPresetsCleanup = readSharedCleanup as unknown as () => Cleanup;

export async function openDatePickerPresetTransitions(page: Page, sample: Sample) {
  await page.goto('/date-picker-preset-transitions.html?sample=' + encodeURIComponent(sample.id));
  const ready = await page.waitForFunction(() => window.datePickerPresetTransitionsNative?.ready === true);
  await ready.dispose();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1000, 750);
}

export interface DatePickerPresetTransitionDisposal {
  beforeUnmount: Point; cleanup: Cleanup; late: Cleanup;
  trace: { operations: Array<{
    operation: 'beforeUnmount-read' | 'dispose-start' | 'dispose-finished' | 'cleanup-read' | 'late-1000-read';
    alive?: boolean;
  }> };
}
export async function settleDatePickerPresetTransitions(page: Page): Promise<Point> {
  let previous = '', stable = 0, prior: Point | null = null, latest: Point | null = null;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const actual = await page.evaluate(readDatePickerPresetTransitions);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = encoded;
    prior = latest;
    latest = actual;
  }
  throw Object.assign(Error('Actual Native DatePicker transition owner did not settle'), {
    observation: { prior, latest }
  });
}
export async function actDatePickerPresetTransitions(
  page: Page, sample: Sample, action: Action, index: number
) {
  await page.evaluate(
    value => window.datePickerPresetTransitionsNative.setActionIndex(value),
    index
  );
  const prefix = sample.prefixCls ?? 'ant-picker';
  if (action.type === 'open') await page.locator('#preset-field').click();
  else if (action.type === 'preset-click') await page.locator('.' + prefix + '-presets li').click();
  else if (action.type === 'leave') await page.mouse.move(1000, 750);
  else if (action.type === 'cell-hover') {
    await page.locator('.' + prefix + '-dropdown td[title="' + action.value + '"]').hover();
  }
  else if (action.type === 'time-hover') {
    const column = page.locator('.' + prefix + '-time-panel-column[aria-label="' + action.unit + '"]');
    const button = action.unit === 'meridiem'
      ? column.getByRole('button', { name: String(action.value).toUpperCase(), exact: true })
      : column.getByRole('button', { name: action.unit + ' ' + action.value, exact: true });
    // Hover the real LI, including when its actual child button is disabled.
    await button.locator('..').hover();
  }
  else if (action.type === 'input-focus') await page.locator('#preset-field').focus();
  else if (action.type === 'input-escape') {
    const input = page.locator('#preset-field');
    if (!await input.evaluate(node => node.ownerDocument.activeElement === node))
      throw Error('Input Escape requires preceding actual input focus');
    await input.press('Escape');
  }
  else if (action.type === 'format' || action.type === 'preview'
    || action.type === 'owner-open' || action.type === 'min-date') {
    return page.evaluate(action => {
      const kind = action.type === 'owner-open' ? 'open' : action.type;
      const button = [...document.querySelectorAll('[data-transition-control]')].find(node =>
        node.getAttribute('data-transition-control') === kind
          && node.getAttribute('data-transition-value') === String(action.value));
      if (!(button instanceof HTMLButtonElement)) throw Error('Actual authored transition control is missing');
      let observed: null | {
        type: string; isTrusted: boolean; targetTag: string | null;
        currentTargetMatches: boolean; activeBefore: string | null;
      } = null;
      button.addEventListener('click', event => {
        observed = {
          type: event.type, isTrusted: event.isTrusted,
          targetTag: event.target instanceof Element ? event.target.tagName : null,
          currentTargetMatches: event.currentTarget === button,
          activeBefore: document.activeElement?.tagName ?? null
        };
      }, { once: true, capture: true });
      window.datePickerPresetTransitionsNative.activateOwnerControl(
        kind as 'open' | 'format' | 'preview' | 'min-date', action.value
      );
      return observed;
    }, action);
  }
  else throw Error('Unknown frozen DatePicker transition action');
  return null;
}
export async function disposeDatePickerPresetTransitions(
  page: Page, beforeUnmount: Point,
  hooks?: { afterCleanup?: () => Promise<void>; afterLate?: () => Promise<void> }
): Promise<DatePickerPresetTransitionDisposal> {
  const operations: DatePickerPresetTransitionDisposal['trace']['operations'] = [
    { operation: 'beforeUnmount-read', alive: beforeUnmount.owner.alive },
    { operation: 'dispose-start' }
  ];
  await page.evaluate(() => window.datePickerPresetTransitionsNative.dispose());
  operations.push({ operation: 'dispose-finished' });
  await drainSelectSurface(page);
  const cleanup = await page.evaluate(readDatePickerPresetsCleanup);
  operations.push({ operation: 'cleanup-read', alive: cleanup.owner.alive });
  await hooks?.afterCleanup?.();
  await page.waitForTimeout(1000);
  const late = await page.evaluate(readDatePickerPresetsCleanup);
  operations.push({ operation: 'late-1000-read', alive: late.owner.alive });
  await hooks?.afterLate?.();
  return { beforeUnmount, cleanup, late, trace: { operations } };
}
