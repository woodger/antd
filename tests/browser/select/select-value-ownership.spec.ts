import { physicalSelectOption } from '../select-physical';
import { test, expect } from '../test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=select-value-ownership');

  await expect(page.locator('#select-value-ownership-fixture')).toBeVisible();
});

for (const mode of ['single', 'multiple'] as const) {
  test(`default ${mode} selection survives parent spreads while primitive labels remain live`, async ({ page }) => {
    const fixture = page.locator('#select-value-ownership-fixture');
    const input = page.getByRole('combobox', { name: `Default ${mode}`, exact: true });
    const control = fixture.locator('.container').filter({ has: input });
    const name = `default-${mode}`;
    const formValues = () => page.locator('[data-value-ownership-form]').evaluate(
      (form, name) => new FormData(form as HTMLFormElement).getAll(name), name);
    const selectedText = () => mode === 'single'
      ? control.locator('[data-ant-select-value]')
      : control.locator('[data-ant-select-selection-item] .ant-select-selection-item-content');
    const expectedText = (beta: string) => mode === 'single' ? [beta] : ['Alpha', beta];

    await input.click();
    await physicalSelectOption(control, { name: 'Beta', exact: true }).click();

    await expect(selectedText()).toHaveText(expectedText('Beta'));
    await expect.poll(formValues).toEqual(mode === 'single' ? ['b'] : ['a', 'b']);

    await fixture.getByRole('button', { name: 'Unrelated revision', exact: true }).click();

    await expect(selectedText()).toHaveText(expectedText('Beta'));
    await expect.poll(formValues).toEqual(mode === 'single' ? ['b'] : ['a', 'b']);

    await fixture.getByRole('button', { name: 'Relabel options', exact: true }).click();

    await expect(selectedText()).toHaveText(expectedText('Beta next'));
    await expect.poll(formValues).toEqual(mode === 'single' ? ['b'] : ['a', 'b']);

    await control.locator('button.clear').click();

    await expect(selectedText()).toHaveCount(0);
    await expect.poll(formValues).toEqual(mode === 'single' ? [''] : []);
    await fixture.getByRole('button', { name: 'Unrelated revision', exact: true }).click();

    await expect(selectedText()).toHaveCount(0);
    await expect.poll(formValues).toEqual(mode === 'single' ? [''] : []);
    await expect(fixture.getByLabel(
      mode === 'single' ? 'Single changes' : 'Multiple changes',
      { exact: true }
    ))
      .toHaveText(mode === 'single' ? '["b",null]' : '[["a","b"],[]]');
  });
}

test('an explicit controlled undefined clears the interaction instead of reviving its snapshot', async ({ page }) => {
  const fixture = page.locator('#select-value-ownership-fixture');
  const input = page.getByRole('combobox', { name: 'Controlled single', exact: true });
  const control = fixture.locator('.container').filter({ has: input });
  await input.click();
  await physicalSelectOption(control, { name: 'Beta', exact: true }).click();

  await expect(input).toHaveValue('Beta');
  await fixture.getByRole('button', { name: 'Clear controlled owner', exact: true }).click();

  await expect(input).toHaveValue('');
  await expect(control.locator('[data-ant-select-value]')).toHaveCount(0);
  await fixture.getByRole('button', { name: 'Unrelated revision', exact: true }).click();

  await expect(input).toHaveValue('');
  await expect(control.locator('[data-ant-select-value]')).toHaveCount(0);
  await expect.poll(() => page.locator('[data-value-ownership-form]').evaluate(
    form => new FormData(form as HTMLFormElement).getAll('controlled'))).toEqual(['']);
  await expect(fixture.getByLabel('Controlled changes', { exact: true })).toHaveText('["b"]');
});

test('template snippet labels render through selection and parent updates', async ({ page }) => {
  const fixture = page.locator('#select-value-ownership-fixture');
  const input = page.getByRole('combobox', { name: 'Rich single', exact: true });
  const control = fixture.locator('.container').filter({ has: input });
  const label = control.locator('[data-ant-select-value] strong');
  await input.click();
  await physicalSelectOption(control, { name: 'Beta rich', exact: true }).click();

  await expect(label).toHaveText('Beta rich');
  await expect(control.locator('[data-ant-select-content]')).toHaveClass(/ant-select-content-has-value/);
  await expect.poll(() => page.locator('[data-value-ownership-form]').evaluate(
    form => new FormData(form as HTMLFormElement).getAll('rich-selection'))).toEqual(['b']);
  await fixture.getByRole('button', { name: 'Unrelated revision', exact: true }).click();

  await expect(label).toHaveText('Beta rich');
});
