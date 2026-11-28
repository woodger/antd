import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-config-use-config-reference.json' with { type: 'json' };

/** Reads the active scopes together without observing a partly updated DOM. */
async function observeScopes(page: Page, names: string[]) {
  return page.evaluate(names => {
    return Object.fromEntries(names.map(name => {
      const output = document.querySelector(`[data-config-scope="${name}"]`);
      return [name, JSON.parse(output?.textContent ?? 'null')];
    }));
  }, names);
}

test('ConfigProvider.useConfig follows inherited size and disabled changes in existing children', async ({
  page
}) => {
  await page.goto('/?fixture=config-use-config');
  const scope = page.locator('[data-config-scope="inherited"]');
  const original = await scope.elementHandle();
  const [initial, inherit, remove] = reference.phases;
  const names = Object.keys(initial.scopes);
  await expect.poll(() => observeScopes(page, names)).toEqual(initial.scopes);

  const apply = page.getByRole('button', { name: 'Apply inherited settings', exact: true });
  await apply.click();

  await expect.poll(() => observeScopes(page, names)).toEqual(inherit.scopes);
  expect(await scope.evaluate((node, before) => node === before, original)).toBe(true);
  await expect(apply).toBeFocused();

  await page.getByRole('button', { name: 'Remove inherited settings', exact: true }).click();

  await expect.poll(() => observeScopes(page, names)).toEqual(remove.scopes);
  expect(await scope.evaluate((node, before) => node === before, original)).toBe(true);
});

test('ConfigProvider.useConfig keeps the form setting during a pending submission', async ({ page }) => {
  await page.goto('/?fixture=config-use-config');
  const { before, during } = reference.submission;
  const names = Object.keys(before);
  const pending = page.getByLabel('Submission pending', { exact: true });
  const helpAction = page.getByRole('button', { name: 'Form help action', exact: true });
  await expect.poll(() => observeScopes(page, names)).toEqual(before);
  await expect(helpAction).toBeEnabled();

  await page.getByRole('button', { name: 'Hold form submission', exact: true }).click();

  await expect(pending).toHaveText('true');
  await expect.poll(() => observeScopes(page, names)).toEqual(during);
  await expect(helpAction).toBeDisabled();

  await page.getByRole('button', { name: 'Finish form submission', exact: true }).click();

  await expect(pending).toHaveText('false');
  await expect(helpAction).toBeEnabled();
  await expect.poll(() => observeScopes(page, names)).toEqual(before);
});

test('Modal resets the configured disabled state in its footer scope', async ({ page }) => {
  await page.goto('/?fixture=config-use-config');
  await page.getByRole('button', { name: 'Apply inherited settings', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Open configuration dialog', exact: true });

  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Config scope dialog', exact: true });
  await expect(dialog).toBeVisible();
  const { scopes, bodyButtonDisabled, footerButtonDisabled, explicitButtonDisabled } = reference.modal;
  await expect.poll(() => observeScopes(page, Object.keys(scopes))).toEqual(scopes);
  expect(await dialog.locator('#modal-body-button').isDisabled()).toBe(bodyButtonDisabled);
  expect(await dialog.locator('#modal-footer-button').isDisabled()).toBe(footerButtonDisabled);
  expect(await dialog.locator('#explicit-disabled-button').isDisabled()).toBe(explicitButtonDisabled);
  await expect(dialog.getByRole('button', { name: 'Accept configuration' })).toBeEnabled();

  await dialog.getByRole('button', { name: 'Close configuration' }).click();

  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
