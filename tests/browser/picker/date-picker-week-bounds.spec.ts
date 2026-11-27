import { test, expect } from '../test';

type PickerKind = 'DatePicker' | 'RangePicker';

// Transmits the boundary scenario to the general Russian-language fixture of the weekly Picker.
function weekPage(kind: PickerKind, dates: Record<string, string>) {
  const params = new URLSearchParams(dates);
  if (kind === 'RangePicker') {
    params.set('range', '');
  }
  return `/date-picker-week-year.html?${params}`;
}

test.beforeEach(async ({ page }) => {
  const fixedTime = new Date('2024-06-11T12:00:00Z');
  await page.clock.setFixedTime(fixedTime);
});

for (const kind of ['DatePicker', 'RangePicker'] as const) {
  const range = kind === 'RangePicker';
  for (const scenario of [
    {
      bound: 'minDate', limit: '2024-12-30', keptWeek: '2025-1',
      rejectedWeek: '2024-1', rejectedDate: '2024-01-03', weekStart: '2024-01-01'
    },
    {
      bound: 'maxDate', limit: '2024-01-03', keptWeek: '2024-1',
      rejectedWeek: '2025-1', rejectedDate: '2024-12-30', weekStart: '2024-12-30'
    }
  ]) {
    const path = weekPage(kind, {
      [scenario.bound]: scenario.limit,
      start: scenario.limit,
      end: scenario.limit,
      panel: scenario.rejectedDate
    });

    test(`${kind} rejects input outside ${scenario.bound} with the same week number`, async ({
      page
    }) => {
      await page.goto(path);
      const model = page.locator('#week-model');

      for (const endpoint of range ? ['start', 'end'] : ['start']) {
        const input = page.locator(`#week-${endpoint}`);
        await expect(input).toHaveValue(scenario.keptWeek);

        await input.fill(scenario.rejectedWeek);
        await expect(input).toHaveAttribute('aria-invalid', 'true');

        await input.press('Enter');

        await expect(model).toHaveText('');

        if (range) {
          await input.press('Escape');
        }

        await expect(input).toHaveValue(scenario.keptWeek);
        await expect(model).toHaveText('');
      }
    });

    test(`${kind} disables the day and week buttons outside ${scenario.bound}`, async ({ page }) => {
      await page.goto(path);
      const month = scenario.rejectedDate.slice(0, 7);
      const grid = page.getByRole('grid', { name: month, exact: true });

      await page.locator('#week-start').click();

      const day = grid.locator(`button[data-picker-date="${scenario.rejectedDate}"]`);
      const week = grid.locator(`button[data-picker-week="${scenario.weekStart}"]`);
      await expect(day).toBeDisabled();
      await expect(week).toBeDisabled();
    });
  }

  test(`${kind} keeps the full week that contains minDate selectable`, async ({ page }) => {
    await page.goto(weekPage(kind, {
      minDate: '2026-01-01', panel: '2025-12-23',
      start: '2026-01-05', end: '2026-01-05'
    }));
    const grid = page.getByRole('grid', { name: '2025-12', exact: true });

    await page.locator('#week-start').click();

    const firstDay = grid.locator('button[data-picker-date="2025-12-29"]');
    const lastDay = grid.locator('button[data-picker-date="2026-01-04"]');
    const earlierWeek = grid.locator('button[data-picker-week="2025-12-22"]');
    await expect(firstDay).toBeEnabled();
    await expect(lastDay).toBeEnabled();
    await expect(earlierWeek).toBeDisabled();

    await grid.locator('button[data-picker-week="2025-12-29"]').click();
    if (range) {
      await lastDay.click();
    }

    await expect(page.locator('#week-model')).toHaveText(JSON.stringify({
      dates: range ? ['2025-12-29', '2026-01-04'] : ['2025-12-29'],
      texts: range ? ['2026-1', '2026-1'] : '2026-1'
    }));
  });

  test(`${kind} highlights only the selected week when week numbers repeat`, async ({ page }) => {
    const selection = { start: '2024-01-03', end: '2024-01-07' };
    const selectedClass = range ? 'ant-picker-week-panel-row-range-start'
      : 'ant-picker-week-panel-row-selected';

    await page.goto(weekPage(kind, { ...selection, panel: '2024-01-03' }));
    await page.locator('#week-start').click();

    const january = page.getByRole('grid', { name: '2024-01', exact: true });
    await expect(january.locator(`tr.${selectedClass}`)).toHaveCount(1);

    await page.goto(weekPage(kind, { ...selection, panel: '2024-12-18' }));
    await page.locator('#week-start').click();

    const december = page.getByRole('grid', { name: '2024-12', exact: true });
    await expect(december.locator('button[data-picker-week="2024-12-30"]')).toBeVisible();
    await expect(december.locator(`tr.${selectedClass}`)).toHaveCount(0);
    if (range) {
      await expect(december.locator('tr.ant-picker-week-panel-row-range-end')).toHaveCount(0);
    }
  });
}
