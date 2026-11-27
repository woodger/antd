import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-picker-confirmation-reference.json' with { type: 'json' };

type Profile = (typeof reference.cases)[number]['profile'];
type ConfirmationState = (typeof reference.cases)[number]['steps'][number]['state'];
const popupSelector = '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)';

/** Reads the window and the full log after one user action. */
async function readConfirmation(page: Page) {
  return page.evaluate(selector => {
    const popup = document.querySelector(selector);
    const button = popup?.querySelector<HTMLButtonElement>('.ant-picker-ok button');
    const inputs = document.querySelectorAll<HTMLInputElement>('#start, #end');
    const ledger = document.querySelector('[aria-label="Picker confirmation events"]');
    const active = document.activeElement;
    return {
      fields: [...inputs].map(input => [input.id, input.value]),
      open: Boolean(popup),
      okDisabled: button?.disabled ?? null,
      focus: popup ? active?.id || active?.tagName || null : null,
      events: JSON.parse(ledger?.textContent || '[]')
    };
  }, popupSelector);
}

/** Chooses cells without hover, then uses native confirmation with a mouse or key. */
async function performAction(page: Page, action: string) {
  const popup = page.locator(popupSelector);
  const ok = popup.locator('.ant-picker-ok button');
  if (action === 'start' || action === 'end') {
    await page.locator('#' + action).click();
  }
  else if (action === 'ok') {
    await ok.click();
  }
  else if (action === 'ok-disabled') {
    await expect(ok).toBeDisabled();
    await ok.evaluate(button => (button as HTMLButtonElement).click());
  }
  else if (action === 'ok-enter') {
    await ok.press('Enter');
  }
  else if (action.startsWith('enter:')) {
    await page.locator('#' + action.split(':')[1]).press('Enter');
  }
  else if (action.startsWith('date:')) {
    const day = '2024-06-' + action.split(':')[1];
    await popup.locator('.ant-picker-panel').first().locator(`td[title="${day}"] button`)
      .evaluate(button => (button as HTMLButtonElement).click());
  }
  else if (action.startsWith('hour:')) {
    const hour = action.split(':')[1];
    await popup.locator('ul[aria-label="hour"]').getByText(hour, { exact: true })
      .evaluate(button => (button as HTMLButtonElement).click());
  }
  else {
    throw new Error(`Unknown picker confirmation action ${action}`);
  }
}

/** Native adds info.source to single calendar events and returns focus after OK. */
function expectedState(profile: Profile, state: ConfirmationState) {
  const firstCalendar = state.events.findIndex(row => row[0] === 'calendar');
  const events = state.events.map((row, index) => {
    if (profile.range || row[0] !== 'calendar') return row;
    const source = profile.datetime && index === firstCalendar ? 'time' : 'date';
    return [row[0], row[1], row[2], row[3], { source }];
  });
  return { ...state, focus: state.open ? state.focus : null, events };
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(reference.reference.now));
  await page.goto('/?fixture=picker-confirmation');
});

for (const { profile, steps } of reference.cases) {
  test(`Picker confirms ${profile.id} in Source callback order`, async ({ page }) => {
    await page.getByLabel('Picker confirmation profile', { exact: true }).selectOption(profile.id);

    for (const { action, state } of steps) {
      await test.step(action, async () => {
        if (action !== 'initial') {
          await performAction(page, action);
        }

        await expect.poll(() => readConfirmation(page)).toEqual(expectedState(profile, state));
        if (!profile.range && (action === 'ok' || action === 'ok-enter')) {
          await expect(page.locator('#start')).toBeFocused();
        }
      });
    }
  });
}
