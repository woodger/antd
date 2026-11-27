import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-mentions-keyboard-reference.json' with { type: 'json' };

type Snapshot = (typeof reference.cases)[number]['state'];

const preservedChoice = {
  value: '@', open: true, focused: true, selection: [1, 1]
};

test.use({ viewport: { width: 960, height: 640 } });

/** Writs the result of real keyboard actions and the order of public calls. */
function readSnapshot(editor: Locator) {
  return editor.evaluate((node: HTMLTextAreaElement) => {
    const root = node.closest('[data-ant-mentions-root]');
    const listbox = root?.querySelector('[role="listbox"]');
    const log = document.getElementById('keyboard-events');
    const events: unknown = JSON.parse(log?.textContent ?? '[]');

    return {
      value: node.value,
      open: listbox?.checkVisibility() ?? false,
      focused: document.activeElement === node,
      selection: [node.selectionStart, node.selectionEnd],
      events
    };
  });
}

/** Opens the menu and sends one final action from the benchmark. */
async function performProfile(page: Page, profile: string) {
  await page.goto(`/select-components-hydration.html?mentions-keyboard=${profile}`);
  await page.addScriptTag({ type: 'module', url: '/mentions-keyboard.client.ts' });
  const editor = page.getByRole('combobox', { name: 'Keyboard editor' });
  await editor.focus();
  if (profile.startsWith('open')) {
    await editor.press('@');
    await expect(page.getByRole('option', { name: 'Alice option' })).toBeVisible();
    await page.locator('#reset-keyboard-events').dispatchEvent('click');
  }

  if (profile.endsWith('composing')) {
    await editor.evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
      bubbles: true, isComposing: true, cancelable: true
    })));
  }
  else if (profile.endsWith('move-out')) {
    await editor.press('@');
  }
  else if (profile === 'keyup-move-in') {
    await editor.evaluate((node: HTMLTextAreaElement) => {
      node.setSelectionRange(6, 6);
      node.dispatchEvent(new KeyboardEvent('keyup', {
        key: '@', keyCode: 50, bubbles: true, cancelable: true
      }));
    });
  }
  else {
    await editor.press('Enter');
  }
  return editor;
}

for (const { profile, state } of reference.cases) {
  if (profile === 'open-prevent-down' || profile === 'open-composing') {
    test(`Mentions preserves its selection guard for ${profile}`, async ({ page }) => {
      const editor = await performProfile(page, profile);
      // RcMentions selects option and here. Svelte retains cancellation of choice and guard IME.
      const events = profile === 'open-prevent-down' ? [['down', false], ['up', false]]
        : [['down', false]];
      await expect.poll(() => readSnapshot(editor)).toEqual({ ...preservedChoice, events });
    });
  }
  else {
    test(`Mentions matches source keyboard callbacks for ${profile}`, async ({ page }) => {
      const editor = await performProfile(page, profile);
      await expect.poll(() => readSnapshot(editor)).toEqual(state);
    });
  }
}

test('the native keydown callback can cancel an open Mentions choice', async ({ page }) => {
  const editor = await performProfile(page, 'open-native-cancel');

  await expect.poll(() => readSnapshot(editor)).toEqual({
    ...preservedChoice,
    events: [['down', false], ['native-down', false], ['up', false]]
  });
});

test('Mentions uses the original caret before the native keyup callback', async ({ page }) => {
  const editor = await performProfile(page, 'keyup-native-move-out');

  const expected: Snapshot = {
    value: '@', open: true, focused: true, selection: [0, 0],
    events: [['change', '@'], ['up', false], ['native-up', false], ['search', '', '@']]
  };
  await expect.poll(() => readSnapshot(editor)).toEqual(expected);
});
