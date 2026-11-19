// Воспроизводит действия с пресетами DatePicker и измеряет ответ владельца.
// Сценарии разделяют реальные действия мыши и вызовы API контрольной страницы.
import type { Page } from '@playwright/test';
import type { DatePickerPresetAction, DatePickerPresetSample } from './date-picker-presets-cases.mjs';
import {
  readDatePickerPresets,
  readDatePickerPresetsCleanup,
  type DatePickerPresetPoint
} from './date-picker-presets-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import type { DatePickerPresetsDisposal } from './date-picker-presets-assertions';

// Открывает fixture и исключает исходный hover до начала измерений.
export async function openDatePickerPresets(page: Page, sample: DatePickerPresetSample) {
  await page.goto('/date-picker-presets.html?sample=' + encodeURIComponent(sample.id));
  await page.waitForFunction(() => window.datePickerPresetsNative?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1000, 750);
}
// При таймауте сохраняет последние два наблюдения, чтобы показать источник изменений.
export async function settleDatePickerPresets(page: Page): Promise<DatePickerPresetPoint> {
  let previous = '';
  let stable = 0;
  let prior: DatePickerPresetPoint | null = null;
  let latest: DatePickerPresetPoint | null = null;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const actual = await page.evaluate(readDatePickerPresets);
    const encoded = JSON.stringify(actual);
    stable = encoded === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = encoded;
    prior = latest;
    latest = actual;
  }
  throw Object.assign(Error('Actual Native DatePicker did not settle'), {
    observation: { prior, latest }
  });
}
// Синхронизирует индекс действия с browser журналом перед вызовом UI или владельца.
export async function actDatePickerPresets(
  page: Page,
  sample: DatePickerPresetSample,
  action: DatePickerPresetAction,
  index: number
) {
  await page.evaluate(index => window.datePickerPresetsNative.setActionIndex(index), index);
  const prefix = sample.prefixCls ?? 'ant-picker';
  if (action.type === 'open') {
    await page.locator('#preset-field').click();
  }
  else if (action.type === 'leave') {
    await page.mouse.move(1000, 750);
  }
  else if (action.type === 'escape') {
    await page.keyboard.press('Escape');
  }
  else if (action.type === 'outside') {
    await page.locator('[data-picker-outside]').click();
  }
  else if (action.type === 'preview') {
    await page.evaluate(value => window.datePickerPresetsNative.setPreview(value), action.value);
  }
  else if (action.type === 'clear') {
    const clearButton = page.locator('.' + prefix + '-clear');
    return clearButton.evaluate(observeClearClick);
  }
  else if (action.type === 'cell-hover') {
    await page.locator('.' + prefix + '-dropdown td[title="' + action.value + '"]').hover();
  }
  else if (action.type === 'preset-hover' || action.type === 'preset-click') {
    const slot = sample.presets.findIndex(preset => preset.id === action.value);
    if (slot < 0) {
      throw Error('Frozen preset id required');
    }
    const node = page.locator('.' + prefix + '-presets li').nth(slot);
    if (action.type === 'preset-hover') {
      await node.hover();
    }
    else {
      await node.click();
    }
  }
  else {
    throw Error('Unknown frozen DatePicker action');
  }
  return null;
}

// Вызывает DOM click и возвращает признак trusted вместе с фактической целью.
function observeClearClick(node: Element) {
  if (!(node instanceof HTMLButtonElement)) {
    throw Error('Actual Native clear button required');
  }

  let observed: null | {
    type: string;
    isTrusted: boolean;
    actualCurrentTarget: boolean;
    targetTag: string | null;
  } = null;
  // Одноразовый слушатель успевает прочитать событие даже при удалении кнопки.
  node.addEventListener('click', event => {
    observed = {
      type: event.type,
      isTrusted: event.isTrusted,
      actualCurrentTarget: event.currentTarget === node,
      targetTag: event.target instanceof Element ? event.target.tagName : null
    };
  }, { once: true, capture: true });
  node.click();
  return observed;
}

// Сравнивает состояние владельца после unmount и после окна поздних обновлений.
export async function disposeDatePickerPresets(page: Page,
  beforeUnmount: DatePickerPresetPoint, hooks?: {
    afterCleanup?: () => Promise<void>; afterLate?: () => Promise<void>
  }): Promise<DatePickerPresetsDisposal> {
  const operations: DatePickerPresetsDisposal['trace']['operations'] = [
    { operation: 'beforeUnmount-read', alive: beforeUnmount.owner.alive },
    { operation: 'dispose-start' }
  ];
  await page.evaluate(() => window.datePickerPresetsNative.dispose());
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
