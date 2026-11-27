import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import {
  dropdownContentCases, dropdownReplacementCases, dropdownToggleCases
} from '../dropdown-lifecycle-reference';
import formContext from '../fixtures/ant-design-dropdown-form-context-reference.json' with { type: 'json' };

const fixture = '/?fixture=dropdown-lifecycle&sample=';

// Software update props by the owner retains the current focus.
async function updateFixture(page: Page, action: string) {
  await page.locator('#' + action).evaluate((button: HTMLButtonElement) => button.click());
}

// Compares visibility events and lifecycle. Svelte snippet is updated on its own.
function nativeEvents(events: unknown[][]) {
  return events.filter(([kind]) => kind !== 'render');
}

// Causes a public editable item, command, or owner upgrade.
async function perform(page: Page, action: string) {
  if (action === 'initial') return;

  if (action === 'fill') {
    const editor = page.locator('#draft');
    await editor.fill('Preserved draft');
    await editor.press('Shift+ArrowLeft');
  }
  else if (['revision', 'replace', 'restore', 'dispose'].includes(action)) {
    await updateFixture(page, action);
  }
  else {
    await page.locator('#' + action).click();
  }
}

// Reliably measures the visibility and state of native input without dependence on role popup.
function readElement(locator: Locator) {
  return locator.evaluate(node => ({
    tag: node.tagName,
    visible: node.checkVisibility({ visibilityProperty: true }),
    value: node instanceof HTMLInputElement ? node.value : null,
    selection: node instanceof HTMLInputElement ? [node.selectionStart, node.selectionEnd] : null
  }));
}

for (const { profile, frames } of dropdownContentCases) {
  test(`Dropdown follows the original popup lifetime for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const popup = page.locator('.subject-popup');
    const identities = new Map<number, Awaited<ReturnType<Locator['elementHandle']>>>();
    const resolvedEvents: unknown[][] = [];
    let revision = 0;
    for (const { action, state } of frames) {
      await perform(page, action);
      if (action === 'revision') revision++;

      const nodes = [
        [popup, state.popup], [page.locator('#custom-body'), state.body],
        [page.locator('#draft'), state.draft], [page.locator('#original-menu'), state.menu]
      ] as const;
      for (const [locator, node] of nodes) {
        if (!node) {
          await expect(locator, action).toHaveCount(0);
          continue;
        }

        await expect(locator, action).toHaveCount(1);
        await expect.poll(() => readElement(locator)).toEqual({
          tag: node.tag, visible: node.visible, value: node.value, selection: node.selection
        });
        const previous = identities.get(node.identity);
        if (previous) {
          expect(await locator.evaluate((current, before) => current === before, previous)).toBe(true);
        }
        else {
          const existing = Array.from(identities.values());
          if (existing.length) {
            expect(await locator.evaluate((current, before) => before.includes(current), existing))
              .toBe(false);
          }
          identities.set(node.identity, await locator.elementHandle());
        }
      }

      if (state.popup) {
        expect(await popup.evaluate(node => node.closest('#portal')?.id ?? null)).toBe(state.target);
        // The condition inside the stored Svelte Snippet continues to be updated in the closed panel.
        const text = state.text?.replace(/Revision \d+/, `Revision ${revision}`);
        await expect.poll(async () => (await popup.textContent())?.replace(/\s+/g, ''))
          .toBe(text?.replace(/\s+/g, ''));
      }
      const focused = action === 'command' ? 'trigger' : state.focus.id ?? state.focus.tag;
      await expect.poll(() => page.evaluate(() =>
        document.activeElement?.id || document.activeElement?.tagName)).toBe(focused);

      resolvedEvents.push(...nativeEvents(state.events));
      await expect(page.locator('#lifecycle-events')).toHaveText(JSON.stringify(resolvedEvents));
    }
  });
}

for (const { profile, open, afterClick, afterUnmount } of dropdownReplacementCases) {
  test(`Dropdown applies Menu context to ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    await page.locator('#trigger').click();
    const popup = page.locator('.subject-popup');
    await expect(popup).toBeVisible();
    await expect(popup.locator('ul[role=menu]')).toHaveCount(open.menus.length);

    for (const menu of open.menus) {
      const list = popup.locator('#' + menu.id);
      await expect(list).toHaveClass(/owner-dropdown-menu.*provider-root/);
      for (const item of menu.items) {
        const row = list.getByRole('menuitem', { name: item.label, exact: true });
        await expect(row).toHaveClass(/\bprovider-item\b/);
        expect(await row.evaluate(node => node.classList.contains('dropdown-item')))
          .toBe(item.className.split(' ').includes('dropdown-item'));
        if (item.isFocused) await expect(row).toBeFocused();
      }
    }
    if (open.focused === 'wrapper') await expect(page.locator('#wrapper')).toBeFocused();

    await popup.getByRole('menuitem', { name: 'Replacement command', exact: true }).click();

    await expect(popup).toBeHidden();
    await expect(page.locator('#trigger')).toBeFocused();
    for (const item of afterClick.menus.find(menu => menu.id === 'replacement')?.items ?? []) {
      const row = popup.locator('#replacement [role=menuitem]');
      expect(await row.evaluate(node => node.classList.contains('owner-dropdown-menu-item-selected')))
        .toBe(item.className.split(' ').includes('owner-dropdown-menu-item-selected'));
    }
    await expect(page.locator('#lifecycle-events')).toHaveText(JSON.stringify(nativeEvents(afterClick.events)));

    await updateFixture(page, 'dispose');

    await expect(popup).toHaveCount(afterUnmount.menus.length);
    await expect(page.locator('#lifecycle-events')).toHaveText(JSON.stringify(nativeEvents(afterUnmount.events)));
  });
}

test('Dropdown accepts a different renderer on reopening and maintains a connected aria-controls', async ({ page }) => {
  await page.goto(fixture + 'wrap-retain');
  const trigger = page.locator('#trigger');
  await expect(trigger).not.toHaveAttribute('aria-controls');
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Commands' });
  const id = await panel.getAttribute('id');
  if (!id) throw new Error('Missing Dropdown popup id');
  await expect(trigger).toHaveAttribute('aria-controls', id);
  await trigger.click();
  await updateFixture(page, 'swap-renderer');
  await expect(page.locator('#custom-body')).toHaveCount(1);
  await expect(page.locator('#next-body')).toHaveCount(0);

  await trigger.click();

  await expect(page.locator('#next-body')).toBeVisible();
  await expect(page.locator('#custom-body')).toHaveCount(0);
  await trigger.press('ArrowDown');
  await expect(panel.getByRole('menuitem', { name: 'Next command' })).toBeFocused();
});

test('Dropdown gives a custom editor keyboard focus and closes when Tab leaves the panel', async ({ page }) => {
  await page.goto(fixture + 'standalone');
  const trigger = page.locator('#trigger');
  const draft = page.getByRole('textbox', { name: 'Editor' });

  await trigger.press('ArrowDown');

  await expect(draft).toBeFocused();
  await draft.press('Tab');
  await expect(page.locator('#inside')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#outside')).toBeFocused();
  await expect(page.getByRole('dialog')).toBeHidden();

  await trigger.press('ArrowDown');
  await expect(draft).toBeFocused();
  await draft.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('Dropdown editor inherits Form.Item feedback and keeps its own value', async ({ page }) => {
  await page.goto(fixture + 'form-editor');
  await page.locator('#trigger').click();
  const editor = page.getByRole('textbox', { name: 'Popup editor' });
  const parentChoice = page.locator('#parent-choice');
  const expected = formContext.passes[0];

  // Scans the design and binding of one editor as the original sample of React.
  async function readField() {
    const state = await editor.evaluate((input: HTMLInputElement) => ({
      value: input.value,
      name: input.name,
      status: Boolean(input.closest('.ant-input-status-error')),
      feedback: Boolean(input.closest('#panel')?.querySelector('.ant-form-item-feedback-icon'))
    }));
    return { ...state, parentValue: await parentChoice.textContent() };
  }

  await expect.poll(readField).toEqual(expected.before);

  await editor.fill('Changed inside');

  await expect.poll(readField).toEqual(expected.after);
});

for (const { profile, frames } of dropdownToggleCases) {
  test(`Dropdown applies live lifecycle flags for ${profile.sample}`, async ({ page }) => {
    await page.goto(fixture + profile.sample);
    const panel = page.locator('.subject-popup');
    const editor = page.locator('#editor');
    const previous = new Map<number, Awaited<ReturnType<Locator['elementHandle']>>>();

    for (const [index, frame] of frames.entries()) {
      if (index > 0) await updateFixture(page, 'lifecycle-toggle-' + (index - 1));

      await expect(panel).toHaveCount(frame.mounted ? 1 : 0);
      if (frame.visible) await expect(panel).toBeVisible();
      else await expect(panel).toBeHidden();
      if (!frame.editor) {
        await expect(editor).toHaveCount(0);
        continue;
      }

      await expect(editor).toHaveValue(frame.editor.value);
      const known = previous.get(frame.editor.key);
      if (known) expect(await editor.evaluate((node, match) => node === match, known)).toBe(true);
      else {
        expect(await editor.evaluate((node, prior) => prior.includes(node), [...previous.values()]))
          .toBe(false);
        previous.set(frame.editor.key, await editor.elementHandle());
      }
    }
  });
}
