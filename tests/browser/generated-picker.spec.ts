import type { Locator, Page } from '@playwright/test';
import {
  readPickerGeneratorBrowser, readPickerGeneratorRootTime, readPickerGeneratorSupplement,
  readPickerGeneratorTimeSwitch, type GeneratedPickerState
} from './date-picker-generator-reference';
import { expect, test } from './test';

const source = readPickerGeneratorBrowser();
const supplement = readPickerGeneratorSupplement();
const rootTime = readPickerGeneratorRootTime();
const profiles = [...source.passes[0], ...supplement.passes[0], ...rootTime.passes[0]];

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
    if (local && event[0] === 'calendar' && (dateSource || profile === 'root-time')) {
      expect(event[3]).toEqual({ source: dateSource ? 'date' : 'time' });
      return [[...event.slice(0, 3), {}]];
    }

    return [event];
  });
}

test('generatePicker corpus contains two equal independent upstream passes', () => {
  expect(source.version).toBe('6.6.8');
  expect(source.revision).toBe('984592267de88fbf9cdaecc96a56629e721c709d');
  expect(profiles).toHaveLength(11);
  for (const { passes } of [source, supplement, rootTime]) {
    expect(passes).toEqual([passes[0], passes[0]]);
  }
  expect(profiles.every(profile => profile.errors.length === 0)).toBe(true);
  expect(profiles.reduce((sum, { profile }) => sum + profile.actions.length, 0)).toBe(46);
  expect(profiles[0].steps.find(step => step.action === 'enter')?.state.events).toContainEqual(['submit']);
});

for (const { profile, steps } of profiles) {
  test(`generatePicker uses the reference values and events for ${profile.id}`, async ({ page }) => {
    await page.goto(`/?fixture=generated-picker&profile=${profile.id}`);
    const form = page.getByRole('form', { name: 'Opaque date form' });
    const fields = form.locator('input[name="opaque"]');
    const control = form.locator('.ant-picker');
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
      if (profile.id === 'root-time' || profile.id === 'child-time') {
        const upstreamOwner = state.ownerClass?.split(/\s+/).filter(name => name.endsWith('-owner'));
        expect(upstreamOwner).toEqual([profile.id === 'root-time' ? 'date-owner' : 'time-owner']);
        const localOwner = (await control.getAttribute('class'))
          ?.split(/\s+/).filter(name => name.endsWith('-owner'));
        expect(localOwner).toEqual(upstreamOwner);
        await expect(control.locator('.ant-picker-suffix')).toHaveText(state.suffix ?? '');
      }
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

test('DatePicker changes calendar and clock modes on the same editor with the accepted value', async ({
  page
}) => {
  await page.goto('/?fixture=generated-picker&profile=switch-time');
  const input = page.locator('#start');
  const popup = page.locator('[data-picker-popup]');
  const toggle = page.locator('#switch-time');
  await expect(input).toHaveValue('13:10:18');
  const original = await input.elementHandle();

  await input.click();
  await act(page, popup, 'hour', false);
  await act(page, popup, 'confirm', false);
  await expect(input).toHaveValue('16:10:18');

  await toggle.click();
  await expect(input).toHaveValue('2024-06-15');
  await input.click();
  await expect(popup.locator('.ant-picker-date-panel')).toBeVisible();
  await popup.getByRole('button', { name: '2024-06-17', exact: true }).click();
  await expect(input).toHaveValue('2024-06-17');

  await toggle.click();
  await expect(input).toHaveValue('00:00:00');
  expect(await input.evaluate((node, initial) => node === initial, original)).toBe(true);

  await input.hover();
  await page.locator('[data-picker-clear]').click();
  await expect(input).toHaveValue('');
  const events = JSON.parse(await page.locator('#generated-events').innerText()) as unknown[][];
  expect(events.slice(-2)).toEqual([
    ['calendar', null, '', { source: 'time' }], ['change', null, '']
  ]);
  await original.dispose();
});

test('the source clock switch passes an undefined format to a custom adapter', () => {
  const { passes } = readPickerGeneratorTimeSwitch();
  const [strict, dayjs] = passes[0];
  expect(passes).toEqual([passes[0], passes[0]]);
  expect([strict.profile.id, dayjs.profile.id]).toEqual(['switch-time-opaque', 'switch-time-dayjs']);

  const reopen = strict.steps.filter(step => step.action === 'start').at(-1)?.state;
  const invalidFormat = ['en_US', '2024-06-15T16:10:18.000Z', 'undefined'];
  expect(reopen?.invalidFormats).toEqual([invalidFormat, invalidFormat]);
  expect(reopen?.fields).toEqual([]);
  expect(strict.errors).toEqual(["Cannot read properties of undefined (reading 'replace')"]);

  const dayjsReopen = dayjs.steps.filter(step => step.action === 'start').at(-1)?.state;
  expect(dayjsReopen?.panels).toContain('ant-picker-date-panel');
  expect(dayjsReopen?.fields).toEqual([['2024-06-15', true, 'opaque']]);
  expect(dayjs.errors).toEqual([]);
});
