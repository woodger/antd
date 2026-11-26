import type { Page } from '@playwright/test';
import reference from './fixtures/ant-design-popconfirm-popup-click-reference.json' with { type: 'json' };
import { expect, test } from './test';

test.use({ reducedMotion: 'reduce' });
const [defaultPortal] = reference.cases;

/** Выбирает тот же способ размещения, который использован в исходном замере. */
async function openProfile(page: Page, profile: string) {
  await page.goto('/?fixture=popconfirm-popup-click');
  await page.getByLabel('Popup click profile').selectOption(profile);
  await page.getByRole('button', { name: 'Open confirmation', exact: true }).click();
}

for (const sample of reference.cases) {
  test(`reports popup clicks and action ordering in the ${sample.profile} portal`, async ({ page }) => {
    await openProfile(page, sample.profile);
    const events = page.getByTestId('popup-click-events');
    const popup = page.getByRole('dialog', { name: 'Confirm fixture action', exact: true });

    await expect(popup).toBeVisible();
    await expect(events).toHaveText('["open"]');
    expect(await popup.evaluate(node => ({
      custom: Boolean(node.closest('#click-study-target')),
      shared: node.hasAttribute('data-ant-tooltip-unique')
    }))).toEqual({ custom: sample.custom, shared: sample.shared });

    await popup.locator('[data-click-role="title"]').click();
    await popup.locator('.ant-popover-container').dispatchEvent('click', { bubbles: true });
    await popup.getByRole('button', { name: 'Prevent default' }).click();
    await popup.getByRole('button', { name: 'Stop propagation' }).click();
    await popup.getByRole('button', { name: 'Cancel action' }).click();
    await expect(popup).toBeHidden();

    await page.getByRole('button', { name: 'Open confirmation', exact: true }).click();
    await popup.getByRole('button', { name: 'Confirm action' }).press('Enter');
    await expect(popup).toBeHidden();

    // В общей панели Source теряет onPopupClick; Native доставляет его текущему владельцу.
    const expected = sample.shared ? defaultPortal.events : sample.events;
    await expect(events).toHaveText(JSON.stringify(expected));
  });
}

test('routes popup clicks to the new owner when the shared surface changes content', async ({ page }) => {
  await openProfile(page, 'shared');
  const surface = page.locator('[data-ant-tooltip-unique]:popover-open');
  const firstTitle = surface.locator('[data-click-role="title"]');
  const secondTitle = surface.locator('[data-click-role="second-title"]');

  await firstTitle.click();
  const original = await surface.elementHandle();
  await page.getByRole('button', { name: 'Open second confirmation' }).click();
  await secondTitle.click();

  expect(await surface.evaluate((node, previous) => node === previous, original)).toBe(true);
  const events = page.getByTestId('popup-click-events');
  await expect(events).toHaveText(JSON.stringify([
    'open',
    { target: 'title', currentTargetIsPopup: true, defaultPrevented: false },
    'close', 'open', 'second-owner',
    { target: 'second-title', currentTargetIsPopup: true, defaultPrevented: false }
  ]));
});
