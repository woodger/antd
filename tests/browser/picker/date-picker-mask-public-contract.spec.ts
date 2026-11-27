import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';

const owners = ['date', 'datetime', 'range', 'time', 'time-range'] as const;
type Owner = typeof owners[number];
type Scenario = 'mouse' | 'reject-open' | 'plain-switch' | 'cancel-key' | 'reject-typed';
test.use({ locale: 'en-US', timezoneId: 'UTC', viewport: { width: 1440, height: 1000 } });

async function open(page: Page, owner: Owner, scenario: Scenario) {
  const fixedTime = new Date('2024-06-10T08:23:45.678Z');
  await page.clock.setFixedTime(fixedTime);
  await page.goto('/date-picker-mask-public-contract.html?owner=' + owner + '&scenario=' + scenario);
  const input = page.locator('#contract-start');
  await expect(input).toBeVisible();
  return input;
}
async function control(page: Page, name: 'reset' | 'plain') {
  // The usual owner control retains a focus: click triggers its public DOM handler.
  await page.locator('[data-contract-' + name + ']').evaluate(button => {
    if (!(button instanceof HTMLButtonElement)) {
      throw Error('Owner control is not a button');
    }
    button.click();
  });
}
async function clickTextStart(page: Page, input: Locator) {
  const geometry = await input.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const css = getComputedStyle(node);
    const x = rect.x + (parseFloat(css.borderLeftWidth) || 0)
      + (parseFloat(css.paddingLeft) || 0) + Math.max(0, parseFloat(css.textIndent) || 0) + 2;
    const y = rect.y + rect.height / 2;
    if (document.elementFromPoint(x, y) !== node) {
      throw Error('Input text edge is covered');
    }
    return { x, y };
  });
  await page.mouse.click(geometry.x, geometry.y);
  await expect(input).toBeFocused();
}

for (const owner of owners) {
  test(`masked ${owner} forwards one native mousedown with the real input receiver`, async ({ page }) => {
    const input = await open(page, owner, 'mouse');
    await clickTextStart(page, input);
    await control(page, 'reset');

    await expect(input).toBeFocused();
    await clickTextStart(page, input);
    const events = page.locator('[data-contract-mouse] li');

    await expect(events).toHaveCount(1);
    await expect(events).toHaveAttribute('data-input-id', 'contract-start');
    await expect(events).toHaveAttribute('data-this-input', 'true');
    await expect(events).toHaveAttribute('data-current-input', 'true');
    await expect(events).toHaveAttribute('data-trusted', 'true');
  });
}

test('range input focus waits for the completed click before opening', async ({ page }) => {
  for (const id of ['contract-start', 'contract-end']) {
    await open(page, 'range', 'mouse');
    const input = page.locator('#' + id);
    const box = await input.boundingBox();
    if (!box) {
      throw Error('Range input geometry missing');
    }
    const model = await page.locator('[data-contract-model]').textContent();
    if (model === null) {
      throw Error('Original range model missing');
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    let held = false;

    try {
      held = true;
      await page.mouse.down();
      await expect(input).toBeFocused();
      await expect(page.locator('[data-contract-mouse] li')).toHaveCount(1);
      await expect(page.locator('[data-contract-mouse] li')).toHaveAttribute('data-input-id', id);
      await expect(page.locator('[data-contract-open]')).toHaveText('false');
      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('[data-picker-popup]:visible')).toHaveCount(0);
      await expect(page.locator('[data-contract-event]')).toHaveCount(0);

      await page.mouse.up();
      held = false;

      await expect(page.locator('[data-contract-open]')).toHaveText('true');
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('[data-picker-popup]:visible')).toHaveCount(1);
      await expect(page.locator('[data-contract-event]')).toHaveCount(1);
      await expect(page.locator('[data-contract-event="open"]')).toHaveText('true');
      await expect(page.locator('[data-contract-model]')).toHaveText(model);
      await expect(input).toBeFocused();
    } finally {
      if (held) await page.mouse.up();
    }
  }
});

test('rejected controlled opening receives one mask request after the accepted calendar candidate', async ({ page }) => {
  const input = await open(page, 'date', 'reject-open');
  await clickTextStart(page, input);
  await control(page, 'reset');

  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowUp');

  await expect(input).toHaveValue('2021-12-31');
  await expect(page.locator('[data-contract-event="calendar"]')).toHaveCount(1);
  await expect(page.locator('[data-contract-event="calendar"]'))
    .toHaveText('2021-12-31T00:00:00.000Z');
  await expect(page.locator('[data-contract-event="open"]')).toHaveCount(1);
  await expect(page.locator('[data-contract-event="open"]')).toHaveText('true');
  await expect(page.locator('[data-contract-event="change"]')).toHaveCount(0);
  expect(await page.locator('[data-contract-event]').evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('data-contract-event')))).toEqual(['calendar', 'open']);
  await expect(page.locator('[data-contract-open]')).toHaveText('false');
  await expect(page.locator('[data-picker-popup]:visible')).toHaveCount(0);
});

test('switching an incomplete mask to the same plain format preserves local text, focus and input identity', async ({ page }) => {
  const input = await open(page, 'date', 'plain-switch');
  await clickTextStart(page, input);
  const original = await input.elementHandle();
  await control(page, 'reset');
  await page.keyboard.press('Backspace');

  await expect(input).toHaveValue('YYYY-12-31');
  await control(page, 'plain');

  await expect(page.locator('[data-contract-profile]')).toHaveText('plain');
  await expect(input).toHaveValue('YYYY-12-31');
  await expect(input).toBeFocused();
  expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect(page.locator('[data-contract-event="calendar"]')).toHaveCount(0);
  await expect(page.locator('[data-contract-event="change"]')).toHaveCount(0);
});

test('native onkeydown cancellation prevents mask edits and calendar callbacks', async ({ page }) => {
  const input = await open(page, 'date', 'cancel-key');
  await clickTextStart(page, input);
  const before = await input.inputValue();
  await control(page, 'reset');
  await page.keyboard.press('1');

  await expect(input).toHaveValue(before);
  await expect(input).toBeFocused();
  await expect(page.locator('[data-contract-keys] li')).toHaveCount(1);
  await expect(page.locator('[data-contract-keys] li')).toHaveAttribute('data-key', '1');
  await expect(page.locator('[data-contract-keys] li')).toHaveAttribute('data-prevented', 'true');
  await expect(page.locator('[data-contract-event]')).toHaveCount(0);
});

test('ordinary date Enter does not submit a rejected typed candidate through the old valid draft', async ({ page }) => {
  const input = await open(page, 'date', 'reject-typed');
  await input.click();
  const original = await input.elementHandle();
  const originalModel = await page.locator('[data-contract-model]').textContent();
  if (originalModel === null) {
    throw Error('Original public model output missing');
  }
  await control(page, 'reset');
  await input.press('Control+A');
  await page.keyboard.type('2021-02-03');

  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.press('Enter');

  await expect(input).toHaveValue('2021-02-03');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-picker-popup]:visible')).toHaveCount(1);
  await expect(page.locator('[data-contract-model]')).toHaveText(originalModel);
  await expect(page.locator('[data-contract-event="change"]')).toHaveCount(0);
  expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
});
