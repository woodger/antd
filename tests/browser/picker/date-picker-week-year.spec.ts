import { test, expect } from '../test';

for (const kind of ['DatePicker', 'RangePicker']) {
  const path = kind === 'DatePicker' ? '/date-picker-week-year.html'
    : '/date-picker-week-year.html?range';

  test(`${kind} keeps the entered Russian week year`, async ({ page }) => {
    await page.goto(path);
    const start = page.locator('#week-start');

    await start.fill('2023-52');
    await start.press('Enter');
    if (kind === 'RangePicker') {
      await page.locator('#week-end').press('Enter');
    }

    const model = page.locator('#week-model');
    await expect(start).toHaveValue('2023-52');
    await expect.poll(async () => JSON.parse(await model.textContent() || 'null')).toMatchObject({
      dates: kind === 'DatePicker' ? [expect.stringMatching(/^2023-12-(2[5-9]|3[01])$/)]
        : [expect.stringMatching(/^2023-12-(2[5-9]|3[01])$/), '2024-01-08'],
      texts: kind === 'DatePicker' ? '2023-52' : ['2023-52', '2024-2']
    });
  });

  for (const endpoint of kind === 'DatePicker' ? ['start'] : ['start', 'end']) {
    test(`${kind} ${endpoint} rejects a nonexistent Russian week`, async ({ page }) => {
      await page.goto(path);
      const input = page.locator(`#week-${endpoint}`);

      await input.fill('2021-53');
      await input.press('Enter');

      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#week-model')).toHaveText('');
    });
  }
}

test('RangePicker keeps the entered Russian week year in the end field', async ({ page }) => {
  await page.goto('/date-picker-week-year.html?range');
  const end = page.locator('#week-end');

  await end.fill('2023-52');
  await end.press('Enter');
  await page.locator('#week-start').press('Enter');

  const model = page.locator('#week-model');
  await expect(end).toHaveValue('2023-52');
  await expect.poll(async () => JSON.parse(await model.textContent() || 'null')).toMatchObject({
    dates: ['2020-12-21', expect.stringMatching(/^2023-12-(2[5-9]|3[01])$/)],
    texts: ['2020-52', '2023-52']
  });
});
