import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-mentions-option-reference.json' with { type: 'json' };

type Case = (typeof reference.cases)[number];
type Sample = Case['before' | 'after'];

const implicitKeys = new Set(['absent-label', 'twins-pointer', 'twins-keyboard']);

test.use({ viewport: { width: 960, height: 640 } });

/** Save the original payload fields. React adds a menu instance identifier to the key. */
function nativeSample(profile: string, state: Sample) {
  const events = state.events.map(event => {
    const [name, payload, prefix] = event;
    if (name !== 'select' || !Array.isArray(payload)) {
      return event;
    }

    const fields: unknown[] = [];
    for (const field of payload) {
      if (!Array.isArray(field) || field[0] !== 'key') {
        fields.push(field);
        continue;
      }
      if (implicitKeys.has(profile)) {
        continue;
      }

      const sourceKey = field[1];
      if (typeof sourceKey !== 'string') {
        throw new Error('Invalid key in Source onSelect');
      }
      const key = sourceKey.replace(/-:[^:]+:$/, '');
      fields.push(['key', profile === 'numeric-key' ? Number(key) : key]);
    }
    return [name, fields, prefix];
  });

  return { ...state, events };
}

/** Reads the labels, visual activity, carriage and order of public events. */
function readSnapshot(editor: Locator) {
  return editor.evaluate((node: HTMLTextAreaElement) => {
    const root = node.closest('[data-ant-mentions-root]');
    const items = Array.from(root?.querySelectorAll('[role="option"]') ?? []);
    const log = document.getElementById('option-events');
    const events: unknown = JSON.parse(log?.textContent ?? '[]');

    return {
      value: node.value,
      focused: node === document.activeElement,
      selection: [node.selectionStart, node.selectionEnd],
      menu: items.filter(item => item.checkVisibility()).map(item => ({
        label: item.textContent,
        disabled: item.getAttribute('aria-disabled'),
        selected: [...item.classList].some(name => name.endsWith('-item-active'))
      })),
      events
    };
  });
}

/** Opens prompts with the usual input in the package component. */
async function openOptions(page: Page, profile: string, text = '@') {
  await page.goto(`/select-components-hydration.html?mentions-option=${profile}`);
  await page.addScriptTag({ type: 'module', url: '/mentions-option.client.ts' });
  const editor = page.getByRole('combobox', { name: 'Option editor' });
  await editor.pressSequentially(text);

  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  return { editor, options };
}

for (const { profile, before, after } of reference.cases) {
  test(`Mentions option data follows Source for ${profile}`, async ({ page }) => {
    const { editor, options } = await openOptions(page, profile, before.value);
    if (profile.endsWith('-keyboard')) await editor.press('ArrowDown');
    await expect.poll(() => readSnapshot(editor)).toEqual(nativeSample(profile, before));

    // Native listbox declares one active option even with general visual illumination.
    await expect(page.getByRole('option', { selected: true })).toHaveCount(1);
    if (profile === 'absent-label' || profile === 'null-label') {
      await expect(options.first()).toHaveAccessibleName('alice');
    }

    if (profile.endsWith('-pointer') || profile === 'explicit-disabled') {
      await options.nth(1).click();
    }
    else if (profile === 'explicit-filtered') {
      await options.first().click();
    }
    else {
      await editor.press('Enter');
    }

    const expected = nativeSample(profile, after);
    if (profile === 'explicit-disabled') {
      // The regular popover retains the focus of the textarea and when the choice is rejected.
      expected.focused = true;
    }
    await expect.poll(() => readSnapshot(editor)).toEqual(expected);
  });
}

test('Mentions passes raw option data through a custom filter and into onSelect', async ({ page }) => {
  const { editor } = await openOptions(page, 'custom-filter');

  await editor.press('Enter');

  await expect.poll(() => readSnapshot(editor)).toEqual({
    value: '@ ',
    focused: true,
    selection: [2, 2],
    menu: [],
    events: [
      ['change', '@'], ['search', '', '@'], ['change', '@ '],
      ['select', [['label', 'From owner'], ['key', 0], ['detail', 'retained']], '@']
    ]
  });
});
