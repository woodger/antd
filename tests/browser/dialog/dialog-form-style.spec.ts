import { test, expect } from '../test';
import reference from '../fixtures/ant-design-dialog-form-style-reference.json' with { type: 'json' };

/** Measures the visible status, feedback icon, and the context available inside the dialog. */
function measure() {
  const metrics: Record<string, { status: string; feedback: boolean; inFormItem: boolean; }> = {};

  for (const owner of document.querySelectorAll<HTMLElement>('[data-style-probe]')) {
    const key = owner.dataset.styleProbe;
    if (!key) {
      continue;
    }

    const controls = Array.from(owner.querySelectorAll('[class]'));
    const classes = controls.flatMap(node => [...node.classList]);
    const suffix = classes.find(name => /^ant-(input|select).*-status-/.test(name));
    metrics[key] = {
      status: suffix?.split('-').at(-1) ?? '',
      feedback: Boolean(owner.querySelector('.ant-form-item-feedback-icon')),
      inFormItem: classes.includes('ant-select-in-form-item')
    };
  }

  const result = document.querySelector('[data-form-status-read="dialog-style"]');
  const value: { status?: string | null; } = JSON.parse(result?.textContent ?? '{}');
  return { metrics, context: value.status ?? '' };
}

for (const sample of reference.cases) {
  test(`${sample.component} isolates inherited Form.Item styling as in Ant Design`, async ({ page }) => {
    await page.goto('/?fixture=dialog-form-style');
    await page.getByRole('combobox', { name: 'Style boundary', exact: true }).selectOption(sample.component);
    await page.getByRole('button', { name: 'Open style boundary', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Form style boundary', exact: true });
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(measure)).toEqual(sample.initial);
    const input = dialog.locator('#dialog-value');
    await input.fill('Edited value');
    const previous = await input.elementHandle();

    await page.getByRole('button', { name: 'Change outer status', exact: true }).evaluate(node => {
      if (node instanceof HTMLButtonElement) node.click();
    });

    await expect.poll(() => page.evaluate(measure)).toEqual(sample.updated);
    expect(await input.evaluate((node, old) => ({
      sameInput: node === old,
      value: node instanceof HTMLInputElement ? node.value : undefined
    }), previous)).toEqual(sample.draft);
    await expect(input).toBeFocused();
  });
}
