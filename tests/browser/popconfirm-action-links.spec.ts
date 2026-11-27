import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-popconfirm-action-links-reference.json' with { type: 'json' };

test.use({ reducedMotion: 'reduce' });

/** Opens the visible panel and preserves action locators and magazine. */
async function openProfile(page: Page, profile: string) {
  await page.goto('/?fixture=popconfirm-action-links');
  await page.getByLabel('Link profile').selectOption(profile);
  const opener = page.getByRole('button', { name: 'Open links' });
  await opener.click();
  const popup = page.getByRole('dialog', { name: 'Review links' });

  return {
    opener,
    popup,
    ok: popup.getByRole('link', { name: 'Confirm link' }),
    cancel: popup.getByRole('link', { name: 'Cancel link' }),
    events: page.getByTestId('popconfirm-link-events')
  };
}

/** Records href and link state without inventing availability by name. */
function readLinks(popup: Locator) {
  return popup.evaluate(panel =>
    [...panel.querySelectorAll<HTMLElement>('.ant-popconfirm-buttons .ant-btn')].map(button => ({
      tag: button.localName,
      text: button.textContent?.trim(),
      href: button.getAttribute('href'),
      target: button.getAttribute('target'),
      rel: button.getAttribute('rel'),
      disabled: button.getAttribute('aria-disabled'),
      tabIndex: button.tabIndex,
      loading: button.classList.contains('ant-btn-loading')
    }))
  );
}

test('Popconfirm follows the pinned action link order and native navigation', async ({ page }) => {
  const { popup, opener, ok, cancel, events } = await openProfile(page, 'links');
  const sample = reference.cases.links;

  await expect(cancel).toBeFocused();
  expect(await readLinks(popup)).toEqual(sample.initial);
  await cancel.press('Enter');
  await expect(page).toHaveURL(new RegExp(sample.cancelHash + '$'));
  await expect(popup).toBeHidden();

  await opener.click();
  await ok.click();

  await expect(page).toHaveURL(new RegExp(sample.hash + '$'));
  await expect(popup).toBeHidden();
  await expect(events).toHaveText(JSON.stringify(sample.events));
});

for (const profile of ['disabled', 'empty'] as const) {
  test(`Popconfirm renders the pinned attributes for a ${profile} href`, async ({ page }) => {
    const { popup } = await openProfile(page, profile);
    expect(await readLinks(popup)).toEqual(reference.cases[profile].initial);
  });
}

test('Popconfirm disables both links and parks focus during a pending confirmation', async ({ page }) => {
  const { popup, ok, events } = await openProfile(page, 'pending');
  const sample = reference.cases.pending;
  expect(await readLinks(popup)).toEqual(sample.initial);
  await ok.press('Enter');

  await expect(popup).toHaveAttribute('aria-busy', 'true');
  await expect(popup.locator('[data-ant-popconfirm-content]')).toBeFocused();
  // In React, both links save href and tabindex. Svelte temporarily disables both.
  expect(await readLinks(popup)).toEqual(sample.waiting.map(link => ({
    ...link, href: null, disabled: 'true', tabIndex: -1
  })));
  await expect(events).toHaveText(JSON.stringify(sample.eventsWhileWaiting));
  await page.keyboard.press('Escape');
  await expect(popup).toBeVisible();

  await page.getByRole('button', { name: 'Resolve link action' }).click();

  await expect(popup).toBeHidden();
  expect(new URL(page.url()).hash).toBe(sample.hash);
  await expect(events).toHaveText(JSON.stringify(sample.events));
});

test('a native link onclick can cancel navigation and the confirmation', async ({ page }) => {
  const { popup, ok, events } = await openProfile(page, 'native');

  await ok.click();

  await expect(popup).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
  await expect(events).toHaveText(JSON.stringify([
    'open', ['ok-native', 'a', '#confirmed'], 'popup-prevented'
  ]));
});

test('Popconfirm updates href and the event target inside the same panel', async ({ page }) => {
  const { popup, opener, ok, events } = await openProfile(page, 'switch');
  const button = popup.getByRole('button', { name: 'Confirm link' });
  await button.press('Enter');
  await expect(popup).toBeHidden();

  await opener.click();
  const original = await popup.elementHandle();
  await page.getByRole('button', { name: 'Set href' }).dispatchEvent('click');
  await expect(ok).toHaveAttribute('href', '#confirmed');
  expect(await popup.evaluate((node, previous) => node === previous, original)).toBe(true);
  await ok.press('Enter');

  await expect(popup).toBeHidden();
  await expect(page).toHaveURL(/#confirmed$/);
  await expect(events).toHaveText(JSON.stringify([
    'open', 'confirm', 'close', ['ok', 'button', ''], 'popup',
    'open', 'confirm', 'close', ['ok', 'a', '#confirmed'], 'popup'
  ]));
});
