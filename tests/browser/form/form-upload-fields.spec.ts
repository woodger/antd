import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-form-upload-fields-observation.json' with { type: 'json' };

type InitialUploads = typeof reference.initial;
type UploadObservation = InitialUploads[keyof InitialUploads] | typeof reference.removed;

async function press(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).evaluate(
    (button: HTMLButtonElement) => button.click()
  );
}

// React passes its component ref directly. Native Form's control handle exposes both bound nodes.
function uploadSnapshot(source: UploadObservation) {
  const { sameAsComponentRef, ...values } = source;
  return { ...values, sameNativeElements: sameAsComponentRef };
}

test('Form scrolls to Upload and Dragger roots and registers their available file controls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?fixture=form-upload-fields');
  const result = page.getByRole('status', { name: 'Upload snapshot' });
  const paths = [
    ['files', reference.initial.select],
    ['drop', reference.initial.dragger],
    ['display', reference.initial.display],
    ['aria', reference.initial.aria]
  ] as const;

  for (const [field, source] of paths) {
    await press(page, `Inspect ${field}`);
    await expect.poll(async () => JSON.parse(await result.innerText()))
      .toEqual(uploadSnapshot(source));
  }

  await press(page, 'Toggle disabled');
  await press(page, 'Inspect aria');
  await expect.poll(async () => JSON.parse(await result.innerText()))
    .toEqual(uploadSnapshot(reference.disabled));
  await press(page, 'Toggle disabled');

  await press(page, 'Submit uploads');
  const submitted = page.getByRole('status', { name: 'Upload submission' });
  await expect.poll(async () => JSON.parse(await submitted.innerText()))
    .toEqual(reference.validation.submitted);
  const file = page.locator('input[type="file"][name="attachments"]');
  await expect(file).toHaveAttribute('aria-invalid', reference.validation.ariaInvalid);
  expect(await file.evaluate(input => {
    const id = input.getAttribute('aria-describedby');
    return id ? input.ownerDocument.getElementById(id)?.textContent : null;
  })).toBe(reference.validation.text);

  const original = await file.elementHandle();
  await press(page, 'Reset files');
  await press(page, 'Inspect files');
  expect(await file.evaluate((input, before) => input !== before, original))
    .toBe(reference.reset.rootReplaced);
  await expect.poll(async () => JSON.parse(await result.innerText()))
    .toEqual(uploadSnapshot(reference.reset.published));

  await press(page, 'Remove uploads');
  await press(page, 'Inspect files');
  await expect(file).toHaveCount(0);
  await expect.poll(async () => JSON.parse(await result.innerText()))
    .toEqual(uploadSnapshot(reference.removed));
});

test('Form keeps a live Upload handle through list updates and releases the previous model', async ({ page }) => {
  await page.goto('/?fixture=form-upload-fields');
  const result = page.getByRole('status', { name: 'Upload snapshot' });
  await press(page, 'Remember upload');
  await press(page, 'Replace files');
  await press(page, 'Check ref');

  const binding = { sameHandle: true, sameElement: true, sameAbort: true,
    sameTransport: true, sameProgress: true };
  await expect.poll(async () => JSON.parse(await result.innerText()))
    .toEqual({ ...binding, oldInstance: true, files: [['receipt.txt', true]] });
  const root = page.locator('[data-ant-upload-root]').first();
  const original = await root.elementHandle();

  await press(page, 'Replace upload model');
  await press(page, 'Check ref');

  expect(await root.evaluate((element, before) => element === before, original)).toBe(true);
  await expect.poll(async () => JSON.parse(await result.innerText()))
    .toEqual({ ...binding, oldInstance: false, files: [] });
});

test('Form associates Upload with its label and preserves a local association', async ({ page }) => {
  await page.goto('/?fixture=form-upload-fields');
  const label = page.locator('label', { hasText: 'Accessible attachment' });
  const input = page.locator('input[type="file"][name="labelled-file"]');
  const chooser = page.waitForEvent('filechooser');
  await label.click();
  expect(await (await chooser).element().getAttribute('name')).toBe('labelled-file');

  await press(page, 'Set local association');
  await expect(label).toHaveAttribute('for', 'manual-file');
  await expect(input).toHaveAttribute('id', 'manual-file');
  await press(page, 'Inspect aria');

  const result = page.getByRole('status', { name: 'Upload snapshot' });
  await expect.poll(async () => JSON.parse(await result.innerText())).toMatchObject({
    labelMatches: true, describedBy: ['Local file note', 'File instructions', 'Maximum size']
  });
});

test('the file input keeps its Form binding when the Upload trigger contains an editor', async ({ page }) => {
  await page.goto('/?fixture=form-upload-fields');
  const input = page.locator('input[name="labelled-file"]');
  const before = await input.elementHandle();

  await press(page, 'Use editor trigger');

  const editor = page.getByRole('textbox', { name: 'Trigger editor' });
  const observed = await editor.evaluate((element: HTMLInputElement) => {
    const doc = element.ownerDocument;
    const file = doc.querySelector<HTMLInputElement>('input[name="labelled-file"]');
    const label = file?.labels?.[0];
    const sameId = [...doc.querySelectorAll('input')].filter(input => input.id === file?.id);

    return {
      id: element.id,
      name: element.name,
      fileBoundToLabel: Boolean(file && label?.control === file),
      matches: sameId.length
    };
  });
  expect(observed).toEqual(reference.nestedTrigger);
  expect(await input.evaluate((element, original) => element === original, before)).toBe(true);
});
