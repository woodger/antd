import type { Locator } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-form-rich-validation-reference.json' with {
  type: 'json'
};

/** Reads the editor's own description boundary, including its actual markup. */
async function describeEditor(editor: Locator) {
  return editor.evaluate(input => {
    const id = input.getAttribute('aria-describedby');
    const description = id ? input.ownerDocument.getElementById(id) : null;
    const markedElements = description?.querySelectorAll('[data-message]') ?? [];

    return {
      invalid: input.getAttribute('aria-invalid'),
      description: description?.textContent ?? null,
      markers: Array.from(markedElements, element => [
        element.tagName, element.getAttribute('data-message')
      ])
    };
  });
}

test('Form keeps rule markup through quiet validation, failed submit, and controlled fields', async ({
  page
}) => {
  await page.goto('/?fixture=form-rich-validation');
  const name = page.getByRole('textbox', { name: /\bName$/ });
  const nested = page.getByRole('textbox', { name: 'Nested field' });
  const manual = page.getByRole('textbox', { name: 'Manual help' });

  await page.getByRole('button', { name: 'Validate quietly' }).click();

  await expect(page.getByTestId('quiet-result')).toHaveText('true');
  expect(await describeEditor(name)).toEqual({
    invalid: reference.afterQuiet.dom.invalid,
    description: reference.afterQuiet.dom.description,
    markers: reference.afterQuiet.dom.markers
  });
  await expect(manual).toHaveAccessibleDescription(reference.seen.manual.description);

  await page.getByRole('button', { name: 'Submit form' }).click();

  const submitted = reference.submitted.map(field => ({ name: field.name, rich: true }));
  await expect(page.getByTestId('submitted-fields')).toHaveText(JSON.stringify([
    ...submitted, { name: ['items'], rich: true }
  ]));
  await expect.poll(() => describeEditor(name)).toEqual({
    invalid: reference.seen.name.invalid,
    description: reference.seen.name.description,
    markers: reference.seen.name.markers
  });
  await expect(page.getByTestId('active-name-errors')).toHaveText('[""]');
  await expect(page.getByTestId('echoed-name-messages')).toHaveText('true');
  const status = page.locator('[data-form-status-read="rich-name"]');
  await expect(status).toHaveAttribute('data-form-rich-errors', '1');
  await expect(status).toHaveAttribute('data-form-rich-warnings', '1');
  await expect(page.locator('[data-rich-feedback]')).toBeVisible();
  await expect(nested).toHaveAccessibleDescription('Read field details');
  await expect(manual).toHaveAccessibleDescription('Enter a name');
  await expect(page.locator('strong[data-message="rich-list"]')).toHaveText('Add at least one item');

  const details = page.getByRole('link', { name: 'Read field details' });
  await details.focus();

  await expect(details).toBeFocused();

  await page.getByRole('button', { name: 'Replace name messages' }).click();

  await expect.poll(() => describeEditor(name)).toEqual({
    invalid: reference.external.name.invalid,
    description: reference.external.name.description,
    markers: reference.external.name.markers
  });

  await page.getByRole('button', { name: 'Clear name messages' }).click();

  await expect(page.getByTestId('active-name-errors')).toHaveText('[]');
  await expect.poll(() => describeEditor(name)).toEqual({
    invalid: null, description: null, markers: []
  });
});
