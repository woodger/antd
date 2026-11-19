import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-inert-api-reference.json' with { type: 'json' };
import { treeSelectInertApiSamples, type TreeSelectInertApiAction } from './fixtures/tree-select-inert-api-cases';
import { readTreeSelectInertApi } from './tree-select-inert-api-metrics';
import { treeSelectInertApiNativeExpected } from './tree-select-inert-api-native';

test.use({ viewport: reference.reference.viewport });

async function act(page: Page, action: TreeSelectInertApiAction, slot: string) {
  const field = page.locator(slot === 'root' ? '[data-inert-api-root]' : '#inert-api-field');
  if (action.type === 'click') await field.click();
  else if (action.type === 'fill') await field.fill(action.text);
  else if (action.type === 'caret') {
    await field.evaluate((node, range) => {
      if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
        throw Error('Expected native editor');
      }
      node.setSelectionRange(range.start, range.end);
    }, action);
  }
  else if (action.type === 'props') {
    await page.locator('[data-inert-api-command]').evaluate((
      node,
      mode
    ) => {
      node.dispatchEvent(new CustomEvent('inertapiupdate', { detail: mode }));
    }, action.mode);
  }
  else if (action.type === 'outside') {
    await page.getByRole(
      'button',
      { name: 'Outside inert API', exact: true }
    ).click();
  }
  else if (action.type === 'choose') {
    await page.getByText(
      action.value === 'a' ? 'Alpha' : 'Beta',
      { exact: true }
    ).last().click();
  }
  else if (action.type === 'remove') {
    await page.locator('.ant-select-selection-item').filter({ hasText: action.value === 'a' ? 'Alpha' : 'Beta' })
      .locator('.ant-select-selection-item-remove').click();
  }
  else throw Error(`Unsupported inherited API action: ${action.type}`);
}

for (const entry of reference.cases) {
  test(`TreeSelect consumes inherited inert props and preserves raw semantic observations for ${entry.id}`, async ({ page }) => {
    const sample = treeSelectInertApiSamples.find(sample => sample.id === entry.id)!;
    await page.goto('/?fixture=tree-select-inert-api');
    await page.getByRole('combobox', { name: 'TreeSelect inherited API sample', exact: true }).selectOption(entry.id);
    await page.mouse.move(0, 0);

    await expect(page.locator('[data-inert-api-case]')).toHaveAttribute(
      'data-inert-api-bound',
      'true'
    );
    const read = () => page.evaluate(readTreeSelectInertApi);

    await expect.poll(read).toEqual(treeSelectInertApiNativeExpected(entry.initial, sample));
    const previous = await page.evaluateHandle(() => {
      const host = document.querySelector('[data-inert-api-case]')!;
      const root = host.querySelector('[data-inert-api-root]') ?? host.querySelector('.ant-select')!;
      return {
        root,
        editor: root.querySelector('input[role="combobox"],textarea[role="combobox"]'),
        popup: null as Element | null
      };
    });
    const observed = () => previous.evaluate(old => {
      const host = document.querySelector('[data-inert-api-case]')!;
      const root = host.querySelector('[data-inert-api-root]') ?? host.querySelector('.ant-select')!;
      const editor = root.querySelector('input[role="combobox"],textarea[role="combobox"]');
      const popup = document.querySelector('.ant-tree-select-dropdown');
      const samePopup = !old.popup || !popup || old.popup === popup;
      old.popup ??= popup;
      const refs: { root?: Element; control?: { focus?: unknown; blur?: unknown } } = {};
      host.querySelector('[data-inert-api-command]')!.dispatchEvent(new CustomEvent(
        'inertapirefs',
        { detail: refs }
      ));
      return { sameRoot: old.root === root, sameEditor: old.editor === editor, samePopup,
        rootIsPublicRef: refs.root === root, focusMethod: typeof refs.control?.focus === 'function',
        blurMethod: typeof refs.control?.blur === 'function' };
    });
    try {
      expect(await observed()).toEqual(entry.initialObserved);
      for (const step of entry.steps) {
        await act(page, step.action as TreeSelectInertApiAction, sample.slot);
        await expect.poll(read, { message: JSON.stringify(step.action) }).toEqual(treeSelectInertApiNativeExpected(
          step.view,
          sample
        ));
        expect(await observed()).toEqual(step.observed);
      }
    } finally { await previous.dispose(); }
  });
}
