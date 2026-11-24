import type { Locator, Page } from '@playwright/test';
import {
  readPickerGeneratorBrowser, readPickerGeneratorSupplement, type GeneratedPickerState
} from './date-picker-generator-reference';
import { expect, test } from './test';

const source = readPickerGeneratorBrowser();
const supplement = readPickerGeneratorSupplement();
const profiles = [...source.passes[0], ...supplement.passes[0]];

/** Выполняет закрытие, набор текста и выбор через пользовательские и штатные кнопки. */
async function act(page: Page, popup: Locator, action: string, multiple: boolean) {
  switch (action) {
    case 'start':
      await page.locator(multiple ? '[data-generated-picker-fixture] .ant-picker' : '#start').click();
      break;
    case 'end':
      await page.locator('#end').click();
      break;
    case 'edit':
      await page.locator('#start').fill('2024-06-26');
      break;
    case 'enter':
      await page.locator('#start').press('Enter');
      break;
    case 'calendar-date':
      await popup.getByRole('button', { name: '2024-06-28', exact: true }).click();
      break;
    case 'hour':
      await popup.locator('.ant-picker-time-panel-column').first()
        .getByText('16', { exact: true }).click();
      break;
    case 'february':
      await popup.getByRole('button', { name: '2024-02', exact: true }).click();
      break;
    case 'confirm':
      await popup.locator('.ant-picker-ok button').click();
      break;
    case 'outside':
      await page.locator('#outside').click();
      break;
    default:
      await expect(popup.locator('[data-opaque-panel]').first())
        .toHaveAttribute('data-adapter-same', 'true');
      await popup.locator(`[data-action="${action}"]`).first().click();
  }
}

/** Сверяет события выбора, учитывая согласованные native info и обработку Enter. */
function projectEvents(events: unknown[][], local: boolean, profile: string) {
  const dateSource = ['editor', 'calendar', 'month', 'month-grid', 'multiple'].includes(profile);

  return events.flatMap(event => {
    if (!local && event[0] === 'submit') {
      return [];
    }
    if (local && event[0] === 'calendar' && dateSource) {
      expect(event[3]).toEqual({ source: 'date' });
      return [[...event.slice(0, 3), {}]];
    }

    return [event];
  });
}

test('generatePicker corpus contains two equal independent upstream passes', () => {
  expect(source.version).toBe('6.6.8');
  expect(source.revision).toBe('984592267de88fbf9cdaecc96a56629e721c709d');
  expect(profiles).toHaveLength(9);
  for (const { passes } of [source, supplement]) {
    expect(passes).toEqual([passes[0], passes[0]]);
  }
  expect(profiles.every(profile => profile.errors.length === 0)).toBe(true);
  expect(profiles.reduce((sum, { profile }) => sum + profile.actions.length, 0)).toBe(38);
  expect(profiles[0].steps.find(step => step.action === 'enter')?.state.events).toContainEqual(['submit']);
});

for (const { profile, steps } of profiles) {
  test(`generatePicker uses the reference values and events for ${profile.id}`, async ({ page }) => {
    await page.goto(`/?fixture=generated-picker&profile=${profile.id}`);
    const form = page.getByRole('form', { name: 'Opaque date form' });
    const fields = form.locator('input[name="opaque"]');
    const popup = page.locator('[data-picker-popup]');
    await expect(fields).toHaveCount(steps[0].state.fields.length);
    const original = await fields.elementHandles();

    for (const { action, state } of steps) {
      if (action !== 'initial') {
        await act(page, popup, action, profile.id === 'multiple');
      }
      // Native multiple сохраняет переданное имя для FormData. В React оно скрыто.
      const expectedFields: GeneratedPickerState['fields'] = state.fields.map(([value, same, name]) => {
        expect(name).toBe(profile.id === 'multiple' ? '' : 'opaque');
        return [value, same, 'opaque'];
      });
      await expect.poll(async (): Promise<GeneratedPickerState> => ({
        fields: await fields.evaluateAll((nodes, initial) => nodes.map((node, index) => {
          const input = node as HTMLInputElement;
          return [input.value, node === initial[index], input.name];
        }), original),
        open: await popup.isVisible(),
        events: projectEvents(
          JSON.parse(await page.locator('#generated-events').innerText()), true, profile.id
        )
      }), { message: `${profile.id}: ${action}` }).toEqual({
        fields: expectedFields,
        open: state.open,
        events: projectEvents(state.events, false, profile.id)
      });
    }
    for (const field of original) await field.dispose();
  });
}

test('generatePicker keeps live owner props, form refs and focused editor identity', async ({ page }) => {
  await page.goto('/?fixture=generated-picker&profile=controlled');
  const input = page.locator('#start');
  await expect(input).toHaveValue('2024-06-15');
  const original = await input.elementHandle();
  await expect(page.locator('#generated-refs')).toHaveText('["DIV",null,null]');

  await page.locator('#new-value').click();
  await page.locator('#focus-picker').click();

  await expect(input).toHaveValue('2024-06-23');
  await expect(input).toBeFocused();
  expect(await input.evaluate((node, initial) => node === initial, original)).toBe(true);
  await page.locator('#remove-picker').click();
  await expect(input).toHaveCount(0);
  await expect(page.locator('#generated-refs')).toHaveText('[null,null,null]');
  await expect(page.locator('[data-picker-popup]')).toHaveCount(0);
  await original.dispose();
});
