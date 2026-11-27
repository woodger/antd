import type { Locator, Page } from '@playwright/test';
import { readPickerComponentsBrowser } from './picker-components-reference';
import type { PickerComponentsProfile } from './fixtures/PickerComponentsFixtures.svelte';
import { expect, test } from './test';

const clock = new Date('2024-06-19T16:00:00Z');
const captures = [readPickerComponentsBrowser('browser'), readPickerComponentsBrowser('editors')];

async function openFixture(page: Page, profile: PickerComponentsProfile) {
  const query = new URLSearchParams({ fixture: 'picker-components', profile: JSON.stringify(profile) });
  await page.clock.setFixedTime(clock);
  await page.goto(`/?${query}`);
}

async function events(page: Page): Promise<unknown[][]> {
  const text = await page.locator('#picker-component-events').textContent();
  return JSON.parse(text ?? '[]');
}

/** React separately reports onFocus/onBlur, Svelte adds source for a single date. */
function comparableEvents(log: unknown[][], range: boolean | undefined) {
  return log.filter(([name]) => name !== 'focus' && name !== 'blur').map(event => (
    !range && event[0] === 'calendar' ? event.slice(0, 3) : event
  ));
}

/** Ordinary Enter in textarea at React inserts the transfer and reopens DatePicker. */
function expectedEvents(log: unknown[][], profile: PickerComponentsProfile, action: string) {
  const comparable = comparableEvents(log, profile.range);
  if (profile.id === 'date-textarea') {
    if (action === 'submit') {
      return comparable.slice(0, -1);
    }
    if (action === 'outside') {
      return comparable.slice(0, -2);
    }
  }
  return comparable;
}

/** Removes the translation of the line only in the two recorded Enter scenarios. */
function expectedValue(text: string, profile: PickerComponentsProfile, action: string) {
  if (profile.id === 'date-textarea' && action === 'submit'
    || profile.id === 'range-textarea' && (action === 'submit' || action === 'end')) {
    return text.replace('\n', '');
  }
  return text;
}

async function readForm(page: Page) {
  return page.getByRole('form', { name: 'Picker form' }).evaluate((form: HTMLFormElement) =>
    new FormData(form).getAll('chosen')
  );
}

async function edit(
  page: Page,
  input: Locator,
  action: string,
  profile: PickerComponentsProfile
) {
  switch (action) {
    case 'start':
      await input.click();
      if (profile.mask) {
        await input.press('ArrowLeft');
        await input.press('ArrowLeft');
        await input.press('ArrowRight');
        await input.press('ArrowRight');
      }
      break;
    case 'edit':
      await input.fill('2024-06-19');
      break;
    case 'edit-time':
      await input.fill('15:26:37');
      break;
    case 'arrow':
      await input.press('ArrowUp');
      break;
    case 'submit':
      await input.press('Enter');
      break;
    case 'end':
      await page.getByLabel('End', { exact: true }).click();
      break;
    case 'confirm': {
      const button = page.locator('button[data-custom-confirm]');
      await expect(button).toHaveText('OK');
      await expect(button).toHaveAttribute('type', 'button');
      await button.click();
      break;
    }
    case 'outside':
      await page.locator('#outside').click();
      break;
    default:
      throw Error(`Unexpected editor action: ${action}`);
  }
}

test('the two captures of each editor flow agree', () => {
  for (const capture of captures) {
    expect(capture.passes[1]).toEqual(capture.passes[0]);
  }
});

for (const { profile, steps, unmounted, errors } of captures
  .flatMap(capture => capture.passes[0]).filter(capture => capture.profile.input)) {
  test(`replays Ant Design custom editor flow for ${profile.id}`, async ({ page }) => {
    expect(errors).toEqual([]);
    expect(unmounted.editors).toEqual([]);
    await openFixture(page, profile);
    const inputs = profile.range
      ? [page.getByLabel('Start', { exact: true }), page.getByLabel('End', { exact: true })]
      : [page.getByLabel('Start', { exact: true })];
    const nodes = await Promise.all(inputs.map(input => input.elementHandle()));
    const popup = page.locator('[data-picker-popup]:visible');

    try {
      for (const { action, state } of steps) {
        await test.step(action, async () => {
          if (action !== 'initial') {
            await edit(page, inputs[0], action, profile);
          }

          const values = state.editors.map(editor => expectedValue(editor.value, profile, action));
          expect(state.editors).toHaveLength(inputs.length);
          for (let index = 0; index < inputs.length; index += 1) {
            const input = inputs[index];
            const expected = state.editors[index];
            await expect(input).toHaveValue(values[index]);
            if (!profile.time || action !== 'confirm') {
              if (expected.active) {
                await expect(input).toBeFocused();
              }
              else {
                await expect(input).not.toBeFocused();
              }
            }
            expect(await input.evaluate((current, original) => current === original, nodes[index]))
              .toBe(expected.same);
            const tag = expected.tag ?? 'INPUT';
            const actual = await input.evaluate((field: HTMLInputElement | HTMLTextAreaElement) => ({
              tag: field.tagName, readonly: field.readOnly,
              selection: [field.selectionStart, field.selectionEnd]
            }));
            expect(actual.tag).toBe(tag);
            expect(actual.readonly).toBe(expected.readonly);
            if (profile.mask && expected.active) {
              expect(actual.selection).toEqual(expected.selection);
            }
          }
          expect(await readForm(page)).toEqual(values);
          await expect.poll(async () => comparableEvents(await events(page), profile.range))
            .toEqual(expectedEvents(state.events, profile, action));
          if (profile.multiple) {
            await expect(page.locator('[data-editor]')).toHaveCount(0);
          }
          else {
            await expect(page.locator('[data-editor]')).toHaveCount(inputs.length);
          }
          if (action === 'submit' && !profile.range || action === 'confirm' || action === 'outside') {
            await expect(popup).toHaveCount(0);
          }
        });
      }
    }
    finally {
      for (const node of nodes) await node.dispose();
    }
  });
}

test('RangePicker updates editor attributes and retains the original input bindings', async ({ page }) => {
  await openFixture(page, { id: 'swap', range: true, input: true });
  const owner = page.locator('[data-components-owner]');
  const start = page.getByRole('combobox', { name: 'Start' });
  const end = page.getByRole('combobox', { name: 'End' });
  const original = await start.elementHandle();

  try {
    await expect(owner).toHaveAttribute('data-start-ref', 'true');
    await expect(owner).toHaveAttribute('data-end-ref', 'true');
    await start.click();
    await start.fill('2024-06-16');
    await start.evaluate((input: HTMLInputElement) => input.setSelectionRange(4, 8));
    await page.locator('#appearance').evaluate((button: HTMLButtonElement) => button.click());

    await expect(start).toHaveClass('edited-picker');
    await expect(start).toBeFocused();
    await expect(start).toHaveValue('2024-06-16');
    expect(await start.evaluate((input: HTMLInputElement, node) => [
      input === node, input.selectionStart, input.selectionEnd
    ], original)).toEqual([true, 4, 8]);
    await start.press('Enter');
    await expect(end).toBeFocused();
    await page.locator('#outside').click();
    await page.locator('#ordinary-input').click();
    await expect(owner).toHaveAttribute('data-start-ref', 'true');
    await expect(owner).toHaveAttribute('data-end-ref', 'true');
    await expect(page.locator('[data-editor]')).toHaveCount(0);

    await page.locator('#textarea-input').click();
    await expect(owner).toHaveAttribute('data-start-ref', 'false');
    await expect(owner).toHaveAttribute('data-end-ref', 'false');
    await expect(page.locator('textarea#start')).toHaveValue('2024-06-16');
    await expect(page.locator('textarea#end')).toHaveValue('2024-06-23');
    expect(await readForm(page)).toEqual(['2024-06-16', '2024-06-23']);
  }
  finally {
    await original.dispose();
  }
});

test('TimeRangePicker confirms each registered textarea through its custom button', async ({ page }) => {
  await openFixture(page, { id: 'time-range', range: true, time: true, input: true,
    textarea: true, button: true });
  const start = page.getByRole('combobox', { name: 'Start' });
  const end = page.getByRole('combobox', { name: 'End' });
  const button = page.locator('button[data-custom-confirm]');

  await start.click();
  await start.fill('15:11:12');
  await button.click();
  await expect(end).toBeFocused();
  await end.fill('16:12:13');
  await button.click();

  await expect(page.locator('[data-picker-popup]:visible')).toHaveCount(0);
  expect(await readForm(page)).toEqual(['15:11:12', '16:12:13']);
  const log = await events(page);
  expect(log.filter(([name]) => name === 'ok')).toHaveLength(2);
  expect(log.filter(([name]) => name === 'change')).toEqual([[
    'change', ['2024-06-15T15:11:12.000+00:00', '2024-06-23T16:12:13.000+00:00'],
    ['15:11:12', '16:12:13']
  ]]);
  expect(log.filter(([name]) => name === 'submit')).toEqual([]);
});

test('the intrinsic confirmation button uses disabled and does not submit the form', async ({ page }) => {
  await openFixture(page, { id: 'confirm', nativeButton: true, needConfirm: true, empty: true });
  const input = page.getByRole('combobox', { name: 'Start' });

  await input.click();
  const button = page.getByRole('button', { name: 'OK', exact: true });
  await expect(button).toBeDisabled();
  await input.fill('2024-06-16');
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute('type', 'button');
  await button.click();

  expect(await readForm(page)).toEqual(['2024-06-16']);
  const log = await events(page);
  expect(log.filter(([name]) => name === 'ok' || name === 'change')).toEqual([
    ['ok', '2024-06-16T00:00:00.000+00:00'],
    ['change', '2024-06-16T00:00:00.000+00:00', '2024-06-16']
  ]);
  expect(log.filter(([name]) => name === 'submit')).toEqual([]);
});
