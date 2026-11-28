import { expect, test } from '../test';
import reference from '../fixtures/ant-design-form-choice-membership-reference.json' with {
  type: 'json'
};

test('Checkbox and Radio wrappers follow styled FormItem ancestry', async ({ page }) => {
  await page.goto('/?fixture=form-choice-membership');
  const cases = Object.entries(reference.react);
  const root = page.locator('#form-choice-membership-fixture');
  const bare = root.locator('[data-case="checkbox:bare-no-style"]').getByRole('checkbox');
  await expect(root.locator('[data-case]')).toHaveCount(cases.length);
  await bare.check();
  await bare.focus();
  const input = await bare.elementHandle();

  for (const prefix of ['audit', 'alternate']) {
    if (prefix === 'alternate') {
      await page.getByRole('button', { name: 'Change prefix' }).evaluate(
        (button: HTMLButtonElement) => button.click()
      );
    }

    for (const [name, inFormItem] of cases) {
      const [control] = name.split(':');
      const wrapper = root.locator(`[data-case="${name}"] label`).filter({ hasText: 'Choice' });
      const base = `${prefix}-${control}-wrapper`;
      const baseClass = new RegExp(`(?:^|\\s)${base}(?:\\s|$)`);
      const membershipClass = new RegExp(`(?:^|\\s)${base}-in-form-item(?:\\s|$)`);

      await expect(wrapper).toHaveClass(baseClass);
      if (inFormItem) {
        await expect(wrapper).toHaveClass(membershipClass);
      }
      else {
        await expect(wrapper).not.toHaveClass(membershipClass);
      }
    }
  }

  await expect(bare).toHaveAttribute('name', 'checkbox-bare');
  await expect(bare).toBeChecked();
  await expect(bare).toBeFocused();
  expect(await bare.evaluate((element, previous) => element === previous, input)).toBe(true);
});
