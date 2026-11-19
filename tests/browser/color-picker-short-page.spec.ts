import { test, expect } from './test';
import reference from './fixtures/ant-design-color-picker-short-page-source-reference.json' with { type: 'json' };

for (const source of reference.cases) {
  const { height } = source.viewport;
  const short = source.documentMinHeight === null;
  const scrollRange = short ? source.first.afterPointerOpen.scrollRange : null;
  const description = `${short ? 'short' : 'scrollable'} ${height}px page`;
  const fixture = short ? 'color-picker-short-page' : 'color-picker-viewport';
  test(`ColorPicker exposes lower colors to the mouse on a ${description}`, async ({ page }) => {
    await page.setViewportSize(source.viewport);
    await page.goto(`/?fixture=${fixture}`);
    const trigger = page.getByRole('button', { name: 'Viewport color', exact: true });
    const popup = page.getByRole('dialog', { name: 'Color picker', exact: true });
    const green = page.getByRole('button', { name: 'Зелёная палитра', exact: true });
    const warm = page.getByRole('button', { name: 'Тёплая палитра', exact: true });
    const orange = popup.getByRole('button', { name: 'rgb(250,140,22)', exact: true });

    await expect(trigger).toBeVisible();
    const initialRange = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (short) expect(initialRange).toBe(0);
    else expect(initialRange).toBeGreaterThan(0);
    await trigger.click();

    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight))
      .toBe(scrollRange ?? initialRange);
    await expect(green).toHaveAttribute('aria-expanded', 'true');
    await expect(warm).toHaveAttribute('aria-expanded', 'false');

    await page.mouse.move(1000, height / 2);
    await page.mouse.wheel(0, short ? 1000 : 200);

    await expect.poll(() => page.evaluate(() => scrollY)).toBe(scrollRange ?? 200);
    await expect(warm).toBeInViewport({ ratio: 1 });
    await warm.click();

    await expect(green).toHaveAttribute('aria-expanded', 'true');
    await expect(warm).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.wheel(0, short ? 1000 : 200);

    await expect(orange).toBeInViewport({ ratio: 1 });
    await orange.click();

    await expect(page.getByRole('status', { name: 'Selected viewport color' })).toHaveText('#fa8c16');

    await page.keyboard.press('Escape');

    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight))
      .toBe(initialRange);
  });

  test(`ColorPicker keeps each keyboard preset visible on a ${description}`, async ({ page }) => {
    await page.setViewportSize(source.viewport);
    await page.goto(`/?fixture=${fixture}`);
    const trigger = page.getByRole('button', { name: 'Viewport color', exact: true });
    const popup = page.getByRole('dialog', { name: 'Color picker', exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');

    await expect(popup).toBeVisible();

    const visited: string[] = [];
    let chosen = false;
    for (let index = 0; index < 30; index++) {
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.matches('.preset-trigger, .preset-color')
          ? { name: active.getAttribute('aria-label') ?? active.textContent?.trim(),
            preset: active.classList.contains('preset-color') } : null;
      });
      if (!focus) continue;
      await expect(page.locator(':focus')).toBeInViewport({ ratio: 1 });
      visited.push(focus.name ?? '');
      if (focus.name === 'Тёплая палитра') {
        await page.keyboard.press('Enter');
        await expect(popup.getByRole('button', { name: 'Зелёная палитра', exact: true }))
          .toHaveAttribute('aria-expanded', 'true');
      }
      if (focus.preset && focus.name === 'rgb(250,140,22)') {
        await page.keyboard.press('Enter');
        chosen = true;
        break;
      }
    }
    expect(visited).toContain('Зелёная палитра');
    expect(visited).toContain('Тёплая палитра');
    expect(chosen).toBe(true);
    await expect(page.getByRole('status', { name: 'Selected viewport color' })).toHaveText('#fa8c16');
    await page.keyboard.press('Escape');

    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test('ColorPicker preserves fixed popup styles while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?fixture=color-picker-fixed-popup');
  await page.getByRole('button', { name: 'Viewport color', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Color picker', exact: true });

  await expect(popup).toHaveCSS('position', 'fixed');
  await expect.poll(async () => (await popup.boundingBox())?.y).toBe(387);

  await page.mouse.move(1000, 500);
  await page.mouse.wheel(0, 200);

  await expect.poll(() => page.evaluate(() => scrollY)).toBe(200);
  await expect.poll(async () => (await popup.boundingBox())?.y).toBe(187);
});
