import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import sourceFacts from '../fixtures/ant-design-date-picker-render-hooks-facts.json' with { type: 'json' };
import type { RenderHooksObservation, RenderHooksOwner } from '../date-picker-render-hooks-native';

const owners: RenderHooksOwner[] = ['single-date', 'single-datetime', 'range-date', 'range-datetime'];
test.use({ viewport: { width: 1440, height: 1000 }, timezoneId: 'UTC' });
const read = (page: Page) => page.evaluate(() =>
  (window as typeof window & { renderHooksRead: () => RenderHooksObservation }).renderHooksRead());
const control = (page: Page, name: string) => page.locator(`[data-control="${name}"]`)
  .evaluate(button => (button as HTMLButtonElement).click());
const popup = (page: Page) => page.locator('[data-picker-popup]:visible');
async function open(page: Page, owner: RenderHooksOwner) {
  await page.goto('/?fixture=date-picker-render-hooks&owner=' + owner);
  const input = page.locator(owner.startsWith('range') ? '#hook-field-start' : '#hook-field');
  await input.click();
  await expect(popup(page)).toBeVisible();
  await expect.poll(async () => (await read(page)).cells.length).toBe(0);
  await control(page, 'enable');
  await expect(popup(page).locator('[data-hook-panel="wrap"]')).toBeVisible();
  return input;
}
async function assertMode(page: Page, mode: string, datetime: boolean) {
  await expect(popup(page).locator('[data-hook-footer]')).toHaveAttribute(
    'data-hook-footer-mode',
    mode
  );
  await expect(popup(page).locator('[data-picker-current]')).toHaveCount(mode === 'date' ? 1 : 0);
  await expect(popup(page).locator('.ant-picker-ok button')).toHaveCount(datetime ? 1 : 0);
  await expect(popup(page).locator('[data-hook-footer]')).toHaveJSProperty('parentElement',
    await popup(page).locator('.ant-picker-footer-extra').elementHandle());
}
async function typeInAuthoredEditor(page: Page, editor: Locator) {
  await editor.click();
  await expect(editor).toBeFocused();
  const before = await editor.evaluate(node => {
    const input = node as HTMLInputElement;
    return { value: input.value, start: input.selectionStart, end: input.selectionEnd };
  });
  expect(before.start).not.toBeNull();
  expect(before.end).not.toBeNull();
  await page.keyboard.type(' typed');
  await expect(editor).toHaveValue(before.value.slice(0, before.start!) + ' typed'
    + before.value.slice(before.end!));
  await expect(editor).toBeFocused();
}
type SourcePhase = Pick<(typeof sourceFacts.cases)[number]['first']['firstwrap'], 'cells' | 'locales'>;
function sourceOptional(value: string | { $: string }) {
  if (typeof value === 'string') {
    return value;
  }
  expect(value).toEqual({ $: 'undefined' });
  return undefined;
}
async function assertSourceCells(page: Page, source: SourcePhase) {
  const actual = await page.evaluate(() => {
    const all = (window as typeof window & {
      renderHooksRead: () => RenderHooksObservation
    }).renderHooksRead().cells;
    return [...document.querySelectorAll('[data-picker-popup] [data-hook-cell]')]
      .map(node => all[Number(node.getAttribute('data-hook-sequence'))]);
  });
  expect(actual).toHaveLength(source.cells.length);
  for (const [index, cell] of actual.entries()) {
    const original = source.cells[index];
    expect(cell.keys).toEqual(original.ownKeys);
    expect(cell.type).toBe(original.type);
    expect(cell.subType).toBe(sourceOptional(original.subType));
    expect(cell.range).toBe(sourceOptional(original.range));
    expect(cell.prefixCls).toBe(original.prefixCls);
    expect(cell.currentKind).toBe(original.current.kind);
    const temporal = 'temporal' in original.current ? original.current.temporal : undefined;
    if (temporal) {
      expect(cell.currentTemporal?.fields).toEqual(temporal.fields);
      expect(cell.currentTemporal?.epoch).toBe(temporal.epoch);
      expect(cell.currentTemporal?.iso).toBe(temporal.iso);
      // JSON preserves the numeric offset, but cannot preserve negative zero.
      expect(cell.currentTemporal?.utcOffset === temporal.utcOffset).toBe(true);
    }
    else if ('value' in original.current) {
      expect(cell.current).toBe(original.current.value);
    }
    else {
      throw Error('Source cell must contain a temporal or scalar snapshot');
    }
    const locale = source.locales.find(item => item.identity === original.localeIdentity)!;
    expect(Object.keys(cell.locale)).toEqual(locale.ownKeys);
    expect(cell.locale).toEqual(locale.plain);
    expect(cell.today).toBe(original.today.temporal.iso);
    for (let previous = 0; previous < index; previous++) {
      expect(cell.todayIdentity === actual[previous].todayIdentity)
        .toBe(original.today.identity === source.cells[previous].today.identity);
      expect(cell.localeIdentity === actual[previous].localeIdentity)
        .toBe(original.localeIdentity === source.cells[previous].localeIdentity);
    }
  }
}

for (const owner of owners) {
  const range = owner.startsWith('range'), datetime = owner.endsWith('datetime');
  const source = sourceFacts.cases.find(item => item.id === owner)!.first;
  test(`DatePicker render hooks expose cell info and the full layout ${owner}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
    await open(page, owner);
    await assertSourceCells(page, source.firstwrap);
    const panel = popup(page).locator('[data-hook-panel]');

    await expect(panel.locator('[data-picker-presets]')).toHaveCount(1);
    await expect(panel.locator('.ant-picker-panel-layout > div > .ant-picker-footer')).toHaveCount(1);
    await expect(panel.locator('.ant-picker-panel .ant-picker-footer')).toHaveCount(0);
    await assertMode(page, 'date', datetime);
    const observation = await read(page);
    const dates = observation.cells.filter(cell => cell.type === 'date');

    expect(dates.length).toBeGreaterThanOrEqual(range && !datetime ? 84 : 42);
    expect(dates[0].currentTemporal?.fields).toEqual([2024, 4, 26, 0, 0, 0, 0]);
    for (const cell of observation.cells) {
      expect(cell.originKind).toBe('function');
      expect(cell.today).toBe('2024-06-10T08:23:45.678Z');
      expect(cell.prefixCls).toBe('ant-picker');
      expect(cell.locale.locale).toBe('en_US');
      expect(cell.locale.cellDateFormat).toBe('D');
      expect(cell.keys).toContain('range');
      expect(cell.range).toBe(range ? 'start' : undefined);
      expect(cell.currentKind).toBe(cell.type === 'time'
        ? cell.subType === 'meridiem' ? 'string' : 'number' : 'dayjs');
      expect(cell.keys.includes('subType')).toBe(cell.type === 'time');
    }
    if (datetime) {
      expect([...new Set(observation.cells.filter(cell => cell.type === 'time').map(cell => cell.subType))])
        .toEqual(['hour', 'minute', 'second', 'millisecond', 'meridiem']);
    }
    expect(await panel.locator('button button').count()).toBe(0);
    await popup(page).locator('.ant-picker-month-btn').first().click();
    await assertMode(page, 'month', datetime);
    await assertSourceCells(page, source.month);
    await popup(page).locator('.ant-picker-year-btn').click();
    await assertMode(page, 'year', datetime);
    await assertSourceCells(page, source.year);
    await popup(page).locator('.ant-picker-year-btn').click();
    await assertMode(page, 'decade', datetime);
    await assertSourceCells(page, source.decade);
    await popup(page).locator('td[title="2020"] button').click();
    await assertMode(page, 'year', datetime);
    await popup(page).locator('td[title="2024"] button').click();
    await assertMode(page, 'month', datetime);
    await popup(page).locator('td[title="2024-06"] button').click();
    await assertMode(page, 'date', datetime);
    if (range) {
      if (datetime) await popup(page).locator('.ant-picker-ok button').click();
      await page.locator('#hook-field-end').click();
      await expect(popup(page).locator('[data-hook-cell][data-hook-range="start"]')).toHaveCount(0);
      await expect(popup(page).locator('[data-hook-cell][data-hook-range="end"]').first()).toBeVisible();
    }
    await page.clock.setFixedTime(new Date('2024-06-11T09:24:46.789Z'));
    await control(page, 'repaint');
    await control(page, 'cell-replace');

    await expect(popup(page).locator('[data-hook-cell]').first())
      .toHaveAttribute('data-hook-today', '2024-06-11T09:24:46.789Z');
    await expect(popup(page).locator('td[title="2024-06-11"]'))
      .toHaveClass(/ant-picker-cell-today/);
    await expect(popup(page).locator('td[title="2024-06-10"]'))
      .not.toHaveClass(/ant-picker-cell-today/);
    await page.clock.setFixedTime(new Date('2024-06-12T10:25:47.890Z'));
    await control(page, 'prefix');

    await expect(popup(page)).toHaveClass(/hook-picker-dropdown/);
    await expect(popup(page).locator('[data-hook-cell]').first())
      .toHaveAttribute('data-hook-today', '2024-06-12T10:25:47.890Z');
    await expect(popup(page).locator('td[title="2024-06-12"]'))
      .toHaveClass(/hook-picker-cell-today/);
    if (datetime) {
      await expect(popup(page).locator('[data-hook-type="time"]').first())
        .toHaveAttribute('data-hook-today', '2024-06-12T10:25:47.890Z');
    }
    await expect.poll(async () => (await read(page)).cells.at(-1)?.prefixCls).toBe('hook-picker');
  });

  test(`DatePicker render hooks replace cells and keep disabled selection ${owner}`, async ({ page }) => {
    await open(page, owner);
    await control(page, 'cell-replace');

    await expect(popup(page).locator('[data-hook-cell] button')).toHaveCount(0);
    await expect(popup(page).locator('[data-hook-cell="wrap"]')).toHaveCount(0);
    const disabled = datetime ? popup(page).locator('ul[aria-label="minute"] [data-hook-value="0"]')
      : popup(page).locator('td[title="2024-06-14"] [data-hook-cell]').first();
    const enabled = datetime ? popup(page).locator('ul[aria-label="minute"] [data-hook-value="45"]')
      : popup(page).locator('td[title="2024-06-18"] [data-hook-cell]').first();
    const calendarCount = () => read(page).then(value => value.events.filter(row => row.name === 'calendar').length);
    const before = await calendarCount();
    await disabled.click();

    expect(await calendarCount()).toBe(before);
    await enabled.click();

    await expect.poll(calendarCount).toBe(before + 1);
    if (!datetime && !range) await page.locator('#hook-field').click();
    await control(page, 'cell-empty-fragment');

    await expect(popup(page).locator('.ant-picker-cell-inner')).toHaveCount(0);
    await expect(popup(page).locator('.ant-picker-time-panel-cell-inner')).toHaveCount(0);
    await expect(popup(page).locator('td').first()).toBeVisible();
  });

  test(`DatePicker panel hooks suppress descendants and preserve outer popup ${owner}`, async ({ page }) => {
    const input = await open(page, owner);
    const parent = await popup(page).elementHandle();
    await control(page, 'panel-replace');

    await expect(popup(page).locator('[data-hook-panel="replace"]')).toBeVisible();
    await expect(popup(page).locator('.ant-picker-panel-layout')).toHaveCount(0);
    const replaced = await read(page);
    await control(page, 'repaint');
    const repainted = await read(page);

    expect(repainted.cells).toEqual(replaced.cells);
    expect(repainted.footers).toEqual(replaced.footers);
    await popup(page).getByRole('button', { name: 'Custom panel' }).click();

    expect((await read(page)).events.at(-1)?.name).toBe('custom-panel');
    await control(page, 'panel-empty-fragment');

    await expect(popup(page).locator('[data-hook-panel]')).toHaveCount(0);
    await expect(popup(page)).toBeVisible();
    expect(await parent?.evaluate(node => node.isConnected)).toBe(true);
    await control(page, 'panel-wrap');

    await expect(popup(page).locator('[data-picker-presets]')).toHaveCount(1);
    await expect(popup(page).locator('[data-hook-footer]')).toHaveCount(1);
    await control(page, 'footer-empty-fragment');

    await expect(popup(page).locator('.ant-picker-footer-extra')).toHaveCount(1);
    await expect(popup(page).locator('[data-hook-footer]')).toHaveCount(0);
    await control(page, 'footer-absent');

    await expect(popup(page).locator('.ant-picker-footer-extra')).toHaveCount(0);
    await control(page, 'close');

    await expect(popup(page)).toHaveCount(0);
    const closed = await read(page);
    await control(page, 'repaint');
    const after = await read(page);

    expect(after.cells).toEqual(closed.cells);
    expect(after.footers).toEqual(closed.footers);
    await control(page, 'reopen');

    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(popup(page).locator('[data-hook-panel="wrap"]')).toBeVisible();
  });

  test(`DatePicker authored editors receive physical pointer focus ${owner}`, async ({ page }) => {
    await open(page, owner);
    for (const label of ['Panel editor', 'Footer editor']) {
      const editor = popup(page).getByRole('textbox', { name: label });
      await typeInAuthoredEditor(page, editor);
      await expect(popup(page)).toBeVisible();
    }
    await control(page, 'cell-editable');
    const editor = popup(page).getByRole('textbox', { name: 'Cell editor' }).first();
    await typeInAuthoredEditor(page, editor);

    expect((await read(page)).events.filter(row => row.name === 'calendar')).toHaveLength(0);
  });
  if (datetime) test(`DatePicker cell locale keeps the raw time defaults ${owner}`, async ({ page }) => {
    await open(page, owner);
    const before = (await read(page)).cells.length;
    await control(page, 'format-only');

    await expect(popup(page).locator('ul[aria-label="second"]')).toHaveCount(0);
    const cells = (await read(page)).cells.slice(before);

    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.locale.fieldTimeFormat).toBe('HH:mm:ss');
      expect(cell.locale.fieldDateTimeFormat).toBe('YYYY-MM-DD HH:mm:ss');
      expect(cell.locale).toEqual(source.formatOnly!.locales[0].plain);
    }
  });
  if (datetime) test(`DatePicker calendar uses the panel time template ${owner}`, async ({ page }) => {
    const input = await open(page, owner);
    const text = await input.inputValue();
    const before = (await read(page)).cells.length;
    await control(page, 'panel-time');

    await expect.poll(async () => (await read(page)).cells.length).toBeGreaterThan(before);
    const dates = (await read(page)).cells.slice(before).filter(cell => cell.type === 'date');

    expect(dates.length).toBeGreaterThan(0);
    for (const cell of dates) expect(cell.currentTemporal?.fields.slice(3)).toEqual([9, 12, 34, 567]);
    await expect(input).toHaveValue(text);
  });
  test(`DatePicker origin cell follows locale formats in every panel ${owner}`, async ({ page }) => {
    await open(page, owner);
    await control(page, 'cell-locale');

    await expect(popup(page).getByRole('button', { name: '2024-06-13', exact: true }).first())
      .toHaveText('D13');
    await expect(popup(page).locator('.ant-picker-month-btn').first()).toHaveText('M06');
    if (datetime) {
      await expect(popup(page).locator('ul[aria-label="meridiem"] button'))
        .toHaveText(['period AM', 'period PM']);
    }
    await popup(page).locator('.ant-picker-month-btn').first().click();

    await expect(popup(page).locator('td[title="2024-06"] button')).toHaveText('M06');
    await popup(page).locator('.ant-picker-year-btn').click();

    await expect(popup(page).locator('td[title="2024"] button')).toHaveText('Y2024');
    await popup(page).locator('.ant-picker-year-btn').click();

    await expect(popup(page).locator('td[title="2020"] button')).toHaveText('Y2020-Y2029');
    const last = (await read(page)).cells.at(-1)!;

    expect(last.locale.cellDateFormat).toBe('[D]DD');
    expect(last.locale.cellYearFormat).toBe('[Y]YYYY');
  });
}

test('DatePicker confirmation keeps the Today label in a date-only panel', async ({ page }) => {
  await open(page, 'single-date');
  await control(page, 'confirm');

  await expect(popup(page).locator('[data-picker-current]')).toHaveText('Today');
  await expect(popup(page).locator('.ant-picker-ok button')).toBeVisible();
});

test('DatePicker wrapped origin retains keyboard selection and isolates nested cell controls', async ({ page }) => {
  await open(page, 'single-datetime');
  const day = popup(page).getByRole('button', { name: '2024-06-13', exact: true });
  await day.focus();
  await day.press('ArrowRight');

  await expect(popup(page).getByRole('button', { name: '2024-06-15', exact: true })).toBeFocused();
  await popup(page).getByRole('button', { name: '2024-06-15', exact: true }).press('Enter');
  const before = (await read(page)).events.filter(row => row.name === 'calendar').length;
  const minute = popup(page).locator('ul[aria-label="minute"]');
  const button = minute.getByRole('button', { name: 'minute 30', exact: true });
  await button.focus();
  await button.press('ArrowDown');

  await expect(minute.getByRole('button', { name: 'minute 45', exact: true })).toBeFocused();
  expect((await read(page)).events.filter(row => row.name === 'calendar')).toHaveLength(before + 1);
  await control(page, 'nested');

  await expect(minute.locator('[data-authored-list]')).toHaveCount(4);
  const beforeCustom = (await read(page)).events.filter(row => row.name === 'calendar').length;
  await minute.getByRole('button', { name: 'Cell action', exact: true }).nth(2).click();

  expect((await read(page)).events.filter(row => row.name === 'calendar')).toHaveLength(beforeCustom);
  expect((await read(page)).events.at(-1)?.name).toBe('custom-cell');
  await control(page, 'nested');
  await minute.getByRole('button', { name: 'minute 30', exact: true }).focus();
  await page.keyboard.press('Home');

  await expect(minute.getByRole('button', { name: 'minute 15', exact: true })).toBeFocused();
});

test('DatePicker custom cell content preserves manual time scroll through render and popup changes', async ({ page }) => {
  await open(page, 'single-datetime');
  const hour: Locator = popup(page).locator('ul[aria-label="hour"]');
  await page.mouse.move(1200, 900);
  const rect = await hour.boundingBox();

  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + 12);
  await page.mouse.wheel(0, 28);
  await page.mouse.move(1200, 900);

  await expect.poll(() => hour.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  const manual = await hour.evaluate(node => node.scrollTop);
  await control(page, 'cell-replace');

  await expect(hour.locator('button')).toHaveCount(0);
  const clamped = await hour.evaluate(
    (node, top) => Math.min(top, node.scrollHeight - node.clientHeight),
    manual
  );

  await expect.poll(() => hour.evaluate(node => node.scrollTop)).toBe(clamped);
  await control(page, 'close');
  await control(page, 'reopen');

  await expect.poll(() => hour.evaluate(node => node.scrollTop)).toBe(clamped);
  await control(page, 'cell-wrap');

  await expect(hour.locator('button')).toHaveCount(2);
  await expect.poll(() => hour.evaluate(node => node.scrollTop)).toBe(clamped);
});
