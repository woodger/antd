import type { JSHandle, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-popup-overflow-reference.json' with { type: 'json' };
import placements from '../fixtures/ant-design-popup-overflow-placement-reference.json' with { type: 'json' };
import type { PopupOverflowAction } from '../fixtures/popup-overflow-cases';
import { popupOverflowAllSamples } from '../fixtures/popup-overflow-placement-cases';
import { actPopupOverflow, drainPopupOverflow, preparePopupOverflow } from '../popup-overflow-driver';
import { readPopupOverflow } from '../popup-overflow-metrics';
import { popupOverflowNativeView } from '../popup-overflow-native';

const entries = [...reference.cases, ...placements.cases];

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await drainPopupOverflow(page);
    const actual = await page.evaluate(readPopupOverflow);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Popup overflow state did not settle after 100 public animation frames');
}

test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  for (const [file, hash] of [
    ['ant-design-popup-overflow-reference.json', '5c8d8182c6f4cdeb107b00b26917119654d442595fa6b03e466bbd3f0e3847d1'],
    ['ant-design-popup-overflow-placement-reference.json', '05e008ec1f9a72e2616f2dfaba8f3d593e0b64f89812b8450b457c391f948396']
  ]) expect(createHash('sha256').update(readFileSync(new URL(`../fixtures/${file}`, import.meta.url)))
    .digest('hex')).toBe(hash);
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.warnings).toEqual([]);
  expect(placements.reference.errors).toEqual([]);
  expect(placements.reference.warnings).toEqual([]);
  expect(entries.map(entry => entry.id)).toEqual(popupOverflowAllSamples.map(sample => sample.id));
});

for (const entry of entries) {
  test(`ConfigProvider popupOverflow matches Source for ${entry.id}`, async ({ page }) => {
    const sample = popupOverflowAllSamples.find(sample => sample.id === entry.id)!;

    expect(sample).toBeDefined();
    await page.goto('/?fixture=popup-overflow');
    await page.getByRole('combobox', { name: 'Popup overflow sample', exact: true }).selectOption(entry.id);

    await expect(page.locator('[data-overflow-case]')).toHaveAttribute(
      'data-overflow-bound',
      'true'
    );
    await preparePopupOverflow(page, sample);
    const initial = await settle(page);

    expect(initial.view).toEqual(entry.initial.view);
    expect(initial.view.leaks).toEqual([]);
    await expect(page.locator('[data-overflow-case] [placement]')).toHaveCount(0);
    const identity = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLInputElement;
        control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-overflow-command]')!
        .dispatchEvent(new CustomEvent('overflowrefs', { detail: refs }));
      return { ...refs, parent: refs.editor?.parentNode,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const bindings = () => identity.evaluate(old => {
      const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLInputElement;
        control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-overflow-command]')!
        .dispatchEvent(new CustomEvent('overflowrefs', { detail: refs }));
      return { root: old.root === refs.root, anchor: old.anchor === refs.anchor,
        editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: old.publicRoot === refs.publicRoot,
        publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    const stableBindings = { root: true, anchor: true, editor: true, parent: true,
      control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true };
    let popup: JSHandle<HTMLElement> | undefined;
    try {
      for (const step of entry.steps) {
        await actPopupOverflow(page, step.action as PopupOverflowAction);
        const actual = await settle(page);
        expect(actual.view, JSON.stringify(step.action)).toEqual(
          popupOverflowNativeView(step.view, sample.id, step.action as PopupOverflowAction)
        );
        expect(actual.view.leaks).toEqual([]);
        expect(await bindings()).toEqual(stableBindings);
        if (actual.view.popup) {
          expect(actual.raw.popups.filter(node => node.visible)).toHaveLength(1);
          expect(actual.raw.popups.find(node => node.visible)!.css?.position).toBe('fixed');
          expect(actual.raw.popups.find(node => node.visible)!.offsetParent).toBeNull();
          if (!popup) {
            popup = await page.evaluateHandle(() => {
              const roots: (Document | ShadowRoot)[] = [document];
              for (const host of document.querySelectorAll('[data-overflow-shadow]')) {
                if (host.shadowRoot) roots.push(host.shadowRoot);
              }
              return roots.flatMap(root => [...root.querySelectorAll<HTMLElement>('.ant-select-dropdown')])
                .find(node => !node.hidden && getComputedStyle(node).display !== 'none')!;
            });
          }
          expect(await popup.evaluate(node => {
            const roots: (Document | ShadowRoot)[] = [document];
            for (const host of document.querySelectorAll('[data-overflow-shadow]')) {
              if (host.shadowRoot) roots.push(host.shadowRoot);
            }
            return roots.flatMap(root => [...root.querySelectorAll<HTMLElement>('.ant-select-dropdown')])
              .find(current => !current.hidden && getComputedStyle(current).display !== 'none') === node;
          })).toBe(true);
        }
        if (step.action.type === 'context' && popup) {
          expect(await popup.evaluate(node => node.isConnected)).toBe(true);
        }
        if (step.action.type === 'open' && 'value' in step.action && !step.action.value && popup) {
          // Select keeps its established conditional popup; the other three retain their nodes.
          expect(await popup.evaluate(node => node.isConnected)).toBe(sample.family !== 'select');
          if (sample.family === 'select') {
            await popup.dispose();
            popup = undefined;
          }
        }
      }
      if (sample.family === 'select') {
        expect(initial.raw.methods).toEqual({ focus: true, blur: true, scrollTo: true });
        expect(initial.raw.publicRoot).toBeNull();
        expect(initial.raw.publicEditor).toBeNull();
      }
      else {
        expect(initial.raw.methods.focus).toBe(true);
        expect(initial.raw.methods.blur).toBe(true);
        expect(initial.raw.publicRoot).not.toBeNull();
        if (!sample.customTrigger) expect(initial.raw.publicEditor?.sameEditor).toBe(true);
      }
    } finally {
      await popup?.dispose();
      await identity.dispose();
    }
  });
}
