import { test, expect } from '../test';
import type { Page } from '@playwright/test';

interface PreviewState {
  actualCalls: number; increments: number; fileIdentity: number;
  originalIdentity: number; callbackIdentity: number; fileListIdentity: number;
  ledger: Array<{ callback: string; file: string; originalIdentity: number }>; pending: number;
}
const state = (page: Page) => page.evaluate(() => {
  const api = (window as Window & { uploadPreviewReactivity?: { read: () => PreviewState } })
    .uploadPreviewReactivity;
  if (!api) {
    throw Error('Mounted public preview fixture required');
  }
  return api.read();
});
const image = (page: Page) => page.locator('#upload-preview-reactivity-fixture .ant-upload-list-item-thumbnail img');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=upload-preview-reactivity');

  await expect(button(page, 'Mount preview Upload')).toBeEnabled();
});

test('Upload invokes a reactive preview callback once and observes its replacement', async ({ page }) => {
  await button(page, 'Mount preview Upload').click();

  await expect(image(page)).toHaveAttribute('src', /red/);
  const first = await state(page);

  expect(first.actualCalls).toBe(1);
  expect(first.increments).toBe(1);
  await button(page, 'Replace preview callback').click();

  await expect(image(page)).toHaveAttribute('src', /blue/);
  const second = await state(page);

  expect(second.actualCalls).toBe(2);
  expect(second.increments).toBe(2);
  expect(second.callbackIdentity).not.toBe(first.callbackIdentity);
  expect(second.fileIdentity).toBe(first.fileIdentity);
  expect(second.originalIdentity).toBe(first.originalIdentity);
  expect(second.fileListIdentity).toBe(first.fileListIdentity);
  expect(second.ledger.map(entry => [entry.callback, entry.file]))
    .toEqual([['A', 'alpha.png'], ['B', 'alpha.png']]);
});

test('Upload previews real origin and owner-file replacements with the same callback', async ({ page }) => {
  await button(page, 'Mount preview Upload').click();

  await expect(image(page)).toHaveAttribute('src', /red/);
  const first = await state(page);
  await button(page, 'Replace origin file').click();

  await expect(image(page)).toHaveAttribute('src', /green/);
  const origin = await state(page);

  expect(origin.actualCalls).toBe(2);
  expect(origin.fileIdentity).toBe(first.fileIdentity);
  expect(origin.originalIdentity).not.toBe(first.originalIdentity);
  await button(page, 'Replace owner file').click();

  await expect(image(page)).toHaveAttribute('src', /purple/);
  const owner = await state(page);

  expect(owner.actualCalls).toBe(3);
  expect(owner.fileIdentity).not.toBe(first.fileIdentity);
  expect(owner.callbackIdentity).toBe(first.callbackIdentity);
  expect(owner.ledger.map(entry => entry.file)).toEqual(['alpha.png', 'beta.png', 'gamma.png']);
});

test('Upload retains text and explicit-thumbnail preview guards across live changes', async ({ page }) => {
  const list = page.getByRole('combobox', { name: 'Preview list type', exact: true });
  const thumb = page.getByRole('combobox', { name: 'Explicit thumbnail', exact: true });
  await list.selectOption('text');
  await button(page, 'Mount preview Upload').click();

  await expect(page.locator('.ant-upload-list-item')).toBeVisible();
  await settle(page);

  expect((await state(page)).actualCalls).toBe(0);
  await list.selectOption('picture');

  await expect(image(page)).toHaveAttribute('src', /red/);
  expect((await state(page)).actualCalls).toBe(1);
  await list.selectOption('text');
  await settle(page);

  expect((await state(page)).actualCalls).toBe(1);
  await expect(image(page)).toHaveCount(0);
  await list.selectOption('picture');

  await expect(image(page)).toHaveAttribute('src', /red/);
  expect((await state(page)).actualCalls).toBe(2);
  await thumb.selectOption('explicit');

  await expect(image(page)).toHaveAttribute('src', /gold/);
  expect((await state(page)).actualCalls).toBe(2);
  await thumb.selectOption('empty');

  await expect(image(page)).toHaveAttribute('src', /gray/);
  expect((await state(page)).actualCalls).toBe(2);
  await thumb.selectOption('generated');

  await expect(image(page)).toHaveAttribute('src', /red/);
  expect((await state(page)).actualCalls).toBe(3);
});

for (const replacement of ['Replace preview callback', 'Replace origin file'])
  test(`Upload ignores an older delayed result after ${replacement}`, async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Delay preview results', exact: true }).check();
    await button(page, 'Mount preview Upload').click();

    await expect(page.getByLabel('Pending preview results', { exact: true })).toHaveText('1');
    await button(page, replacement).click();

    await expect(page.getByLabel('Pending preview results', { exact: true })).toHaveText('2');
    await button(page, 'Resolve newest preview').click();
    const expected = replacement === 'Replace preview callback' ? /blue/ : /green/;

    await expect(image(page)).toHaveAttribute('src', expected);
    await button(page, 'Resolve oldest preview').click();
    await settle(page);

    await expect(image(page)).toHaveAttribute('src', expected);
    expect((await state(page)).actualCalls).toBe(2);
    await expect(page.getByLabel('Pending preview results', { exact: true })).toHaveText('0');
  });

test('Upload stays unmounted when a pending preview resolves and starts fresh after remount', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Delay preview results', exact: true }).check();
  await button(page, 'Mount preview Upload').click();

  await expect(page.getByLabel('Pending preview results', { exact: true })).toHaveText('1');
  await button(page, 'Unmount preview Upload').click();
  await button(page, 'Resolve oldest preview').click();
  await settle(page);

  await expect(page.locator('.ant-upload-list-item')).toHaveCount(0);
  expect((await state(page)).actualCalls).toBe(1);
  await button(page, 'Mount preview Upload').click();

  await expect(page.getByLabel('Pending preview results', { exact: true })).toHaveText('1');
  await expect(image(page)).toHaveAttribute('src', /gray/);
  expect((await state(page)).actualCalls).toBe(2);
  await button(page, 'Resolve newest preview').click();

  await expect(image(page)).toHaveAttribute('src', /red/);
});
