import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import { selectVirtualReference as reference, selectVirtualNativeCases } from '../select-virtual-reference';
import { selectVirtualNativeView, readSelectVirtualAriaIntegrity } from '../select-virtual-native';
import { selectVirtualSamples, selectVirtualActions, type SelectVirtualAction } from '../fixtures/select-virtual-cases';
import { actSelectVirtual, drainSelectVirtual, prepareSelectVirtual } from '../select-virtual-driver';
import { actSelectVirtualHover } from '../select-virtual-hover-driver';
import { readSelectVirtual } from '../select-virtual-metrics';
import { installSelectVirtualShadowStyleProbe } from '../select-virtual-shadow-styles';

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await drainSelectVirtual(page);
    const actual = await page.evaluate(readSelectVirtual);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Select virtual geometry, window or callback ledger did not settle');
}

test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  expect(reference.reference.errors).toEqual([]);
  expect(reference.reference.diagnostics).toEqual([{
    current: { id: 'select-tags', action: 'mount' },
    message: 'Warning: Please avoid setting option to disabled in tags mode since user can always type text as tag.'
  }]);
  expect(reference.cases.map(entry => entry.id)).toEqual(selectVirtualSamples.map(sample => sample.id));
  for (const entry of reference.cases) {
    const sample = selectVirtualSamples.find(sample => sample.id === entry.id)!;
    expect(entry.steps.map(step => step.action)).toEqual(selectVirtualActions(sample));
  }
});

for (const entry of selectVirtualNativeCases) {
  test(`Select measured list follows Source for ${entry.id}`, async ({ page }, testInfo) => {
    const sample = selectVirtualSamples.find(sample => sample.id === entry.id)!;
    const act = sample.scenario === 'selected' ? actSelectVirtualHover : actSelectVirtual;
    await page.goto('/?fixture=select-virtual');
    await page.getByRole('combobox', { name: 'Select virtual sample', exact: true }).selectOption(entry.id);

    await expect(page.locator('[data-select-virtual-case]')).toHaveAttribute(
      'data-select-virtual-bound',
      'true'
    );
    if (sample.layout === 'scaled-shadow') await page.evaluate(installSelectVirtualShadowStyleProbe);
    await prepareSelectVirtual(page);
    const identity = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
        control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-select-virtual-command]')!
        .dispatchEvent(new CustomEvent('virtualrefs', { detail: refs }));
      return { ...refs, parent: refs.editor?.parentNode,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const bindings = () => identity.evaluate(old => {
      const refs: { root?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
        control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement } = {};
      document.querySelector('[data-select-virtual-command]')!
        .dispatchEvent(new CustomEvent('virtualrefs', { detail: refs }));
      return { root: old.root === refs.root, editor: old.editor === refs.editor,
        parent: old.parent === refs.editor?.parentNode, control: old.control === refs.control,
        publicRoot: refs.publicRoot === refs.root, publicEditor: refs.publicEditor === refs.editor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    const stableBindings = { root: true, editor: true, parent: true, control: true,
      publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true };
    const trace: unknown[] = [];
    try {
      const initial = await settle(page);
      trace.push({ phase: 'initial', actual: initial });
      expect(initial.view).toEqual(selectVirtualNativeView(entry.initial.view, entry.id, 'initial'));
      expect(initial.raw.methods).toEqual({ focus: true, blur: true, scrollTo: true });
      expect(initial.raw.publicRoot).toEqual({ tag: 'DIV', sameRoot: true });
      expect(initial.raw.publicEditor).toEqual({ tag: 'INPUT', sameEditor: true });
      expect(initial.raw.renders).toEqual(entry.initial.raw.renders);
      expect(await bindings()).toEqual(stableBindings);
      expect(await page.evaluate(readSelectVirtualAriaIntegrity)).toBe(true);
      for (const step of entry.steps) {
        const action = step.action as SelectVirtualAction;
        await act(page, action);
        const actual = await settle(page);
        trace.push({ action, actual });
        expect(actual.view, JSON.stringify(action)).toEqual(selectVirtualNativeView(
          step.view,
          entry.id,
          'step',
          action
        ));
        expect(actual.raw.renders, `public renderer arguments: ${JSON.stringify(action)}`).toEqual(step.raw.renders);
        expect(actual.view.leaks).toEqual([]);
        expect(await bindings()).toEqual(stableBindings);
        expect(await page.evaluate(readSelectVirtualAriaIntegrity)).toBe(true);
        if (sample.layout === 'scaled-shadow') {
          const continuity = await page.evaluate(() => window.selectVirtualShadowStyleProbe!.read());
          expect(continuity.violations).toEqual([]);
          expect(continuity.syncs).toBeGreaterThan(0);
          trace.push({ phase: 'shadow-stylesheet-continuity', action, actual: continuity });
        }
        // Resolve Source's actual logical target, including its unassigned AC index -1.
        const activeId = step.view.editor?.activeDescendant;
        const sourceTargets = step.view.editor?.expanded === 'true' && activeId
          ? step.view.popup?.viewport.aria.flatMap(listbox => listbox.options)
            .filter(option => option.id === activeId)
            .map(option => ({ role: 'option', text: option.text, label: option.label,
              selected: option.selected, disabled: option.disabled })) ?? [] : [];
        expect(await page.evaluate(() => {
          const refs: { root?: HTMLElement; editor?: HTMLInputElement } = {};
          document.querySelector('[data-select-virtual-command]')!
            .dispatchEvent(new CustomEvent('virtualrefs', { detail: refs }));
          const editor = refs.editor!;
          const id = editor.getAttribute('aria-activedescendant');
          if (editor.getAttribute('aria-expanded') !== 'true' || !id) {
            return [];
          }
          const roots: (Document | ShadowRoot)[] = [document];
          for (const host of document.querySelectorAll('[data-select-virtual-shadow]')) {
            if (host.shadowRoot) roots.push(host.shadowRoot);
          }
          const targets = roots.map(root => root.getElementById(id)).filter(node => node != null);
          return targets.map(node => ({ role: node!.getAttribute('role'), text: node!.textContent,
            label: node!.getAttribute('aria-label'), selected: node!.getAttribute('aria-selected'),
            disabled: node!.getAttribute('aria-disabled') }));
        })).toEqual(sourceTargets);
      }
    } finally {
      if (sample.layout === 'scaled-shadow') await page.evaluate(() => window.selectVirtualShadowStyleProbe?.stop());
      await testInfo.attach(
        'actual-select-virtual',
        { body: JSON.stringify(trace, null, 2), contentType: 'application/json' }
      );
      await identity.dispose();
    }
  });
}
