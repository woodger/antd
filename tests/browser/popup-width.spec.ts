import type { JSHandle, Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-popup-width-reference.json' with { type: 'json' };
import {
  popupWidthSamples, popupWidthHistorySamples, type PopupWidthAction
} from './fixtures/popup-width-cases';
import { actPopupWidth, drainPopupWidth, preparePopupWidth } from './popup-width-driver';
import { readPopupWidth } from './popup-width-metrics';
import { popupWidthNativeView } from './popup-width-native';

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await drainPopupWidth(page);
    const actual = await page.evaluate(readPopupWidth);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Popup width did not settle after 100 public animation frames');
}

test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings).toEqual([]);
  expect(reference.cases.map(entry => entry.id))
    .toEqual([...popupWidthSamples, ...popupWidthHistorySamples].map(sample => sample.id));
});

for (const entry of reference.cases) {
  test(`popupMatchSelectWidth matches Source for ${entry.id}`, async ({ page }) => {
    const sample = [...popupWidthSamples, ...popupWidthHistorySamples]
      .find(sample => sample.id === entry.id)!;
    await page.goto('/?fixture=popup-width');
    await page.getByRole('combobox', { name: 'Popup width sample', exact: true }).selectOption(entry.id);
    await expect(page.locator('[data-width-case]')).toHaveAttribute('data-width-bound', 'true');
    await preparePopupWidth(page);
    const initial = await settle(page);
    expect(initial.view).toEqual(entry.initial.view);
    const identity = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement; control?: Record<string, unknown>;
        publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-width-command]')!
        .dispatchEvent(new CustomEvent('widthrefs', { detail: refs }));
      return { ...refs, parent: refs.editor?.parentNode,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const bindings = () => identity.evaluate(old => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement; control?: Record<string, unknown>;
        publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-width-command]')!
        .dispatchEvent(new CustomEvent('widthrefs', { detail: refs }));
      return { root: old.root === refs.root, editor: old.editor === refs.editor,
        parent: old.parent === refs.editor?.parentNode, control: old.control === refs.control,
        publicRoot: old.publicRoot === refs.publicRoot, publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    const stableBindings = { root: true, editor: true, parent: true, control: true,
      publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true };
    let popup: JSHandle<HTMLElement> | undefined;
    try {
      for (const step of entry.steps) {
        const action = step.action as PopupWidthAction;
        await actPopupWidth(page, action);
        const actual = await settle(page);
        expect(actual.view, JSON.stringify(action)).toEqual(popupWidthNativeView(step.view, entry.id, action));
        expect(actual.view.leaks).toEqual([]);
        expect(await bindings()).toEqual(stableBindings);
        if (actual.view.popup) {
          expect(actual.raw.popups.filter(node => node.visible)).toHaveLength(1);
          expect(actual.raw.popups.find(node => node.visible)!.css.position).toBe('fixed');
          expect(actual.raw.popups.find(node => node.visible)!.offsetParent).toBeNull();
          if (!popup) popup = await page.evaluateHandle(() => {
            const roots: (Document | ShadowRoot)[] = [document];
            for (const host of document.querySelectorAll('[data-width-shadow]'))
              if (host.shadowRoot) roots.push(host.shadowRoot);
            return roots.flatMap(root => [...root.querySelectorAll<HTMLElement>('.ant-select-dropdown')])
              .find(node => !node.hidden && getComputedStyle(node).display !== 'none')!;
          });
          expect(await popup.evaluate(node => node.isConnected)).toBe(true);
          expect(await popup.evaluate(node => {
            const roots: (Document | ShadowRoot)[] = [document];
            for (const host of document.querySelectorAll('[data-width-shadow]'))
              if (host.shadowRoot) roots.push(host.shadowRoot);
            const current = roots.flatMap(root => [...root.querySelectorAll<HTMLElement>('.ant-select-dropdown')])
              .find(element => !element.hidden && getComputedStyle(element).display !== 'none');
            return current === node;
          })).toBe(true);
        }
        if (action.type === 'open' && !action.value && popup) {
          // Keep the established conditional Select DOM and retained AC/TreeSelect DOM.
          expect(await popup.evaluate(node => node.isConnected)).toBe(sample.family !== 'select');
          if (sample.family === 'select') {
            await popup.dispose();
            popup = undefined;
          }
        }
      }
      if (sample.family === 'select') {
        expect(initial.raw.methods).toEqual({ focus: false, blur: false, scrollTo: false });
        expect(initial.raw.publicRoot).toBeNull();
        expect(initial.raw.publicEditor).toBeNull();
      } else {
        expect(initial.raw.methods.focus).toBe(true);
        expect(initial.raw.methods.blur).toBe(true);
        expect(initial.raw.publicRoot?.sameRoot).toBe(true);
        expect(initial.raw.publicEditor?.sameEditor).toBe(true);
      }
    } finally {
      await popup?.dispose();
      await identity.dispose();
    }
  });
}
