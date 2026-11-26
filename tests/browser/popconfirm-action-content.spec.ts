import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-popconfirm-action-content-reference.json' with { type: 'json' };

test.use({ reducedMotion: 'reduce' });

/** Готовит один экземпляр, его панель и точки наблюдения за действиями. */
async function selectProfile(page: Page, profile: string) {
  await page.goto('/?fixture=popconfirm-action-content');
  await page.getByLabel('Action profile').selectOption(profile);
  const popup = page.getByRole('dialog', { name: 'Review fixture changes' });
  return {
    popup,
    opener: page.getByRole('button', { name: 'Open review' }),
    ok: popup.getByRole('button', { name: 'Locale confirm' }),
    cancel: popup.getByRole('button', { name: 'Locale cancel' }),
    events: page.getByTestId('popconfirm-action-events')
  };
}

/** Сравнивает видимое содержимое и публичные классы оформления Button. */
function readPanel(popup: Locator) {
  return popup.evaluate(node => {
    const buttons = [...node.querySelectorAll('.ant-popconfirm-buttons > .ant-btn')].map(button => ({
      text: button.textContent.trim(),
      appearance: [...button.classList].filter(name => name === 'ant-btn-dangerous'
        || name.startsWith('ant-btn-color-') || name.startsWith('ant-btn-variant-')).sort(),
      rich: Boolean(button.querySelector('[data-action-rich]'))
    }));
    const icon = node.querySelector('.ant-popconfirm-message-icon');
    const message = node.querySelector('.ant-popconfirm-message');
    const directText = [...message?.childNodes ?? []]
      .filter(child => child.nodeType === Node.TEXT_NODE)
      .map(child => child.textContent?.trim()).join('');
    return {
      buttons,
      icon: {
        wrapper: Boolean(icon),
        text: icon?.textContent.trim() ?? null,
        rich: Boolean(icon?.querySelector('[data-action-rich]')),
        glyph: Boolean(icon?.querySelector('svg')),
        outside: directText
      }
    };
  });
}

for (const sample of reference.cases) {
  test(`ports Popconfirm action content and appearance for ${sample.profile}`, async ({ page }) => {
    const { popup } = await selectProfile(page, sample.profile);
    await expect(popup).toBeVisible();
    const { profile, buttons, icon } = sample;

    // Svelte сохраняет явное пустое значение, число 0 и скрытый от ARIA декоративный icon.
    let explicitText: string | undefined;
    if (profile === 'zero') {
      explicitText = '0';
    }
    else if (profile === 'empty' || profile === 'boolean') {
      explicitText = '';
    }
    const expected = {
      buttons: buttons.map(button => ({
        ...button,
        text: explicitText ?? button.text
      })),
      icon: profile === 'zero' ? { ...icon, wrapper: true, text: '0', outside: '' } : icon
    };
    expect(await readPanel(popup)).toEqual(expected);
    if (expected.icon.wrapper) {
      await expect(popup.locator('.ant-popconfirm-message-icon')).toHaveAttribute('aria-hidden', 'true');
    }
  });
}

test('runs compatible onClick after cancel and keyboard confirm like the source', async ({ page }) => {
  const { popup, opener, ok, cancel, events } = await selectProfile(page, 'events');

  await opener.click();
  await cancel.click();
  await expect(popup).toBeHidden();
  await opener.click();
  await ok.press('Enter');

  await expect(popup).toBeHidden();
  await expect(events).toHaveText(JSON.stringify(reference.events));
});

test('reports the button click while confirmation is pending and closes once', async ({ page }) => {
  const { popup, opener, ok, cancel, events } = await selectProfile(page, 'pending');
  await opener.click();
  await ok.press('Enter');

  await expect(popup).toHaveAttribute('aria-busy', 'true');
  await expect(ok).toBeDisabled();
  await expect(cancel).toBeDisabled();
  await expect(events).toHaveText(JSON.stringify(reference.pending.waiting));

  await page.getByRole('button', { name: 'Resolve action' }).click();
  await expect(popup).toBeHidden();
  await expect(events).toHaveText(JSON.stringify(reference.pending.settled));
});

test('lets the native onclick prevent both actions when both spellings are supplied', async ({ page }) => {
  const { popup, opener, ok, cancel, events } = await selectProfile(page, 'native-events');

  await opener.click();
  await cancel.click();
  await ok.click();

  await expect(popup).toBeVisible();
  await expect(events).toHaveText(JSON.stringify([
    'open', 'cancel-native', 'popup-prevented', 'ok-native', 'popup-prevented'
  ]));
});

test('handles a thrown confirmation and interrupts the compatible click sequence', async ({ page }) => {
  const { popup, opener, ok, events } = await selectProfile(page, 'failure');

  await opener.click();
  await ok.click();

  await expect(popup.getByRole('alert')).toBeVisible();
  await expect(events).toHaveText(JSON.stringify(['open', 'confirm', 'error', 'popup']));
});

for (const profile of ['cache', 'fresh']) {
  test(`tracks a replacement action snippet in the hidden ${profile} panel`, async ({ page }) => {
    const { popup, opener, cancel } = await selectProfile(page, profile);
    const original = page.locator('[data-action-rich="ok"]');
    const updated = page.locator('[data-action-rich="updated"]');
    await expect(original).toBeVisible();
    await cancel.click();
    await expect(popup).toBeHidden();

    await page.getByRole('button', { name: 'Replace action content' }).click();

    await expect(original).toHaveCount(profile === 'fresh' ? 0 : 1);
    await expect(updated).toHaveCount(profile === 'fresh' ? 1 : 0);
    await opener.click();
    await expect(updated).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Save draft' })).toBeVisible();
  });
}
