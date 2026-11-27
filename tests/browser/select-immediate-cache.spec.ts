import type { Page } from '@playwright/test';
import { physicalSelectOption } from './select-physical';
import { test, expect } from './test';
import reference from './fixtures/ant-design-select-immediate-cache-reference.json' with { type: 'json' };

const fixture = '/?fixture=select-immediate-cache&sample=';

/** The owner's action does not change the focus of the editor and the operation of the keyboard. */
async function updateOwner(page: Page, action: string) {
  await page.locator('#' + action).evaluate((button: HTMLButtonElement) => button.click());
}

/** Compares public fields option with raw React payload. */
function sourceOption(record: unknown): unknown {
  if (Array.isArray(record)) return record.map(sourceOption);
  if (record && typeof record === 'object' && 'data' in record) return record.data;
  return null;
}

/** In Svelte onValueChange precedes onChange to request a change. */
function withValueChanges(events: readonly unknown[][]) {
  return events.flatMap(([name, value, option]) => name === 'change'
    ? [['value', value, null], [name, value, option]]
    : [[name, value, option]]);
}

/** Reads the actual shape fields, including the selected numerical zero. */
function formValues(page: Page) {
  return page.locator('[data-select-cache-form]').evaluate((form: HTMLFormElement) =>
    new FormData(form).getAll('fruit'));
}

for (const { profile, frames } of reference.passes[0]) {
  test(`Select preserves option data during owner updates for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const editor = page.getByRole('combobox', { name: 'Fruit' });
    const control = page.locator('[data-ant-select-control]');
    const selected = profile.multiple
      ? control.locator('[data-ant-select-selection-item] .ant-select-selection-item-content')
      : control.locator('[data-ant-select-value]');
    const events = page.locator('#cache-events');
    const initial = frames[0].state;
    const final = frames[frames.length - 1].state;
    const choice = initial.events.find(([name]) => name === 'select');
    if (!choice) throw new Error('Source did not select an option');

    const caption = profile.fieldNames ? 'Compact label' : 'Apple label';
    const raw = profile.fieldNames ? '0' : 'apple';
    const selection = initial.events.map(([name, value, option]) => [
      name, value, sourceOption(option)
    ]);

    await editor.click();
    await physicalSelectOption(page, { name: 'Apple label', exact: true }).click();

    await expect(events).toHaveText(JSON.stringify(withValueChanges(selection)));
    await expect(page.locator('#cache-owner')).toHaveText(JSON.stringify(initial.value));
    await expect(editor).toBeFocused();
    if (profile.rejected) {
      await expect(page.locator('#cache-binding-request')).toHaveText('["apple"]');
      await expect(selected).toHaveCount(0);
      await expect.poll(() => formValues(page)).toEqual([]);

      await updateOwner(page, 'adopt');

      await expect(selected).toHaveText(raw);
      await updateOwner(page, 'accept');
    }
    else {
      await expect(selected).toHaveText(caption);
      if (profile.delayed) {
        await updateOwner(page, 'hide');
        await expect(selected).toHaveText(caption);
      }
      if (profile.reappears) {
        await updateOwner(page, 'reappear');
        await expect(selected).toHaveText('Fresh label');
      }
    }
    await expect.poll(() => formValues(page)).toEqual([raw]);

    if (profile.multiple) await control.locator('[data-ant-select-selection-item-remove]').click();
    else await control.locator('button.clear').click();

    await expect(selected).toHaveCount(0);
    await expect.poll(() => formValues(page)).toEqual(profile.multiple ? [] : ['']);
    const expected = final.events.map(([name, value, option]) => {
      if (name === 'deselect' && !profile.rejected && !profile.reappears) {
        // Save the raw option from the choice, even if in the original measurement the cache has already lost the recording.
        return [name, choice[1], sourceOption(choice[2])];
      }
      return [name, value, sourceOption(option)];
    });
    await expect(events).toHaveText(JSON.stringify(withValueChanges(expected)));
    if (profile.multiple) {
      await expect(page.locator('#cache-metadata')).toHaveText(String(!profile.rejected));
    }
  });
}

test('Select retains the first option when bind:value immediately filters it out', async ({ page }) => {
  await page.goto(fixture + 'bound');
  const editor = page.getByRole('combobox', { name: 'Fruit' });
  const control = page.locator('[data-ant-select-control]');
  const remove = control.locator('[data-ant-select-selection-item-remove]');

  await editor.click();
  await physicalSelectOption(page, { name: 'Apple label', exact: true }).click();

  await expect(page.locator('#cache-owner')).toHaveText('["apple"]');
  await expect(remove).toHaveAccessibleName('Remove Apple label');
  await expect.poll(() => formValues(page)).toEqual(['apple']);

  await remove.click();

  await expect(page.locator('#cache-owner')).toHaveText('[]');
  await expect(page.locator('#cache-metadata')).toHaveText('true');
  await expect(remove).toHaveCount(0);
});

test('a rejected removal retains the selected cache until the owner clears it', async ({ page }) => {
  await page.goto(fixture + 'rejected-removal');
  const editor = page.getByRole('combobox', { name: 'Fruit' });
  const control = page.locator('[data-ant-select-control]');
  const remove = control.locator('[data-ant-select-selection-item-remove]');

  await editor.click();
  await physicalSelectOption(page, { name: 'Apple label', exact: true }).click();
  await updateOwner(page, 'reject');
  await remove.click();

  await expect(page.locator('#cache-binding-request')).toHaveText('[]');
  await expect(page.locator('#cache-owner')).toHaveText('["apple"]');
  await expect(remove).toHaveAccessibleName('Remove Apple label');
  await expect(page.locator('#cache-metadata')).toHaveText('true');
  await expect.poll(() => formValues(page)).toEqual(['apple']);

  await updateOwner(page, 'accept');
  await remove.click();
  await expect(remove).toHaveCount(0);
  await updateOwner(page, 'adopt');

  await expect(remove).toHaveAccessibleName('Remove apple');
  await remove.click();
  await expect(page.locator('#cache-metadata')).toHaveText('false');
});
