import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-picker-controlled-confirmation-reference.json' with { type: 'json' };

type Sample = (typeof reference.cases)[number];
type RecordedState = Sample['steps'][number]['state'];
const fixture = '#picker-controlled-confirmation-fixture';
const dropdown = '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)';

/** Performs the choice without hover and confirms the choice of a full-time button. */
async function act(page: Page, profile: Sample['profile'], action: string) {
  const popup = page.locator(dropdown);
  if (action === 'start') {
    const selector = profile.multiple ? `${fixture} .ant-picker` : '#start';
    await page.locator(selector).first().click();
  }
  else if (action === 'ok') {
    await popup.locator('.ant-picker-ok button').click();
  }
  else if (action.startsWith('hour:')) {
    const hour = action.split(':')[1];
    const column = popup.locator('ul[data-type="hour"], ul[aria-label="hour"]');
    await column.getByText(hour, { exact: true }).evaluate(node => (node as HTMLButtonElement).click());
  }
  else if (action.startsWith('date:')) {
    const day = '2024-06-' + action.split(':')[1];
    await popup.locator(`td[title="${day}"] button`)
      .evaluate(node => (node as HTMLButtonElement).click());
  }
  else {
    throw new Error(`Unknown controlled picker action ${action}`);
  }
}

/** Reads the displayed value, panel status and callbacks chronology. */
async function readSelection(page: Page) {
  return page.evaluate(({ fixture, dropdown }) => {
    const root = document.querySelector(fixture);
    const inputs = root?.querySelectorAll<HTMLInputElement>('input') ?? [];
    const ledger = root?.querySelector('[aria-label="Controlled picker confirmation events"]');
    const popup = document.querySelector(dropdown);
    const ok = popup?.querySelector<HTMLButtonElement>('.ant-picker-ok button');
    return {
      fields: Array.from(inputs, input => input.value),
      open: Boolean(popup),
      okDisabled: ok?.disabled ?? null,
      events: JSON.parse(ledger?.textContent || '[]')
    };
  }, { fixture, dropdown });
}

/** Root DatePicker reports info.source in a single editor and at the list. */
function expectedState(profile: Sample['profile'], state: RecordedState) {
  const hasCalendarSource = profile.entry === 'root' || profile.entry === 'date';
  const events = state.events.map(event => hasCalendarSource && event[0] === 'calendar'
    ? [...event.slice(0, 4), { source: profile.entry === 'date' ? 'date' : 'time' }]
    : event);
  return { fields: state.fields.map(([, value]) => value), open: state.open,
    okDisabled: state.okDisabled, events };
}

for (const { profile, steps } of reference.cases) {
  test(`Keeps the Source confirmation sequence for ${profile.id}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(reference.reference.now));
    await page.goto('/?fixture=picker-controlled-confirmation&profile=' + profile.id);

    for (const { action, state } of steps) {
      await test.step(action, async () => {
        if (action !== 'initial') {
          await act(page, profile, action);
        }

        await expect.poll(() => readSelection(page)).toEqual(expectedState(profile, state));
        if (profile.range && state.open) {
          await expect(page.locator('#' + state.focus)).toBeFocused();
        }
      });
    }
  });
}
