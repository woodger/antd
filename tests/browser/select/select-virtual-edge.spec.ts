import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import {
  selectVirtualEdgeSamples, selectVirtualEdgeActions,
  type SelectVirtualEdgeSample, type SelectVirtualEdgeAction
} from '../fixtures/select-virtual-edge-cases';
import { readSelectVirtual } from '../select-virtual-metrics';
import { actSelectVirtual, drainSelectVirtual, prepareSelectVirtual } from '../select-virtual-driver';
import { selectVirtualNativeView, readSelectVirtualAriaIntegrity } from '../select-virtual-native';

type Snapshot = ReturnType<typeof readSelectVirtual> & { observed: Record<string, boolean> };
type SizeCall = ReturnType<NonNullable<Window['selectVirtualEdge']>['getSizeCalls']>[number];
interface EdgeReference {
  reference: { version: string; react: string; revision: string; archiveSha256: string;
    umdArchiveByteEqual: boolean; viewport: { width: number; height: number }; errors: unknown[]; diagnostics: unknown[] };
  cases: Array<{ id: string; sample: SelectVirtualEdgeSample; initial: Snapshot;
    steps: Array<Snapshot & { action: SelectVirtualEdgeAction; getSizeCalls: SizeCall[] }>;
    beforeUnmount: {
      focusKind: 'root' | 'editor' | null;
      rootFocused: boolean;
      editorFocused: boolean;
      activeTag: string | null
    };
    cleanup: { rootConnected: boolean; anchorConnected: boolean; editorConnected: boolean; popupConnected: boolean;
      callbacks: unknown[][]; offsets: unknown[] } }>;
}
const bytes = readFileSync(new URL(
  '../fixtures/ant-design-select-virtual-edge-reference.json',
  import.meta.url
));
if (bytes.length !== 468644 || createHash('sha256').update(bytes).digest('hex')
  !== 'd24d994e056eca0b2f3901f050f948474c36ce3135caf4d324395c93f984097a') {
  throw Error('Frozen actual Source virtual edge capture changed');
}
const reference = JSON.parse(bytes.toString('utf8')) as EdgeReference;

test.use({ viewport: reference.reference.viewport });
test.beforeAll(() => {
  expect(reference.reference).toMatchObject({ version: '6.6.8', react: '18.3.1',
    revision: '984592267de88fbf9cdaecc96a56629e721c709d',
    archiveSha256: '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa',
    umdArchiveByteEqual: true, viewport: { width: 1200, height: 900 }, errors: [], diagnostics: [] });
  expect(reference.cases.map(entry => entry.id)).toEqual(selectVirtualEdgeSamples.map(sample => sample.id));
  expect(reference.cases.reduce((count, entry) => count + entry.steps.length, 0)).toBe(14);
  for (const entry of reference.cases) {
    const sample = selectVirtualEdgeSamples.find(sample => sample.id === entry.id)!;
    expect(sample).toEqual(entry.sample);
    expect(entry.steps.map(step => step.action)).toEqual(selectVirtualEdgeActions(sample));
    expect(entry.cleanup.callbacks).toEqual(entry.steps.at(-1)!.view.events);
  }
});

async function settle(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectVirtual(page);
    const projection = await page.evaluate(readSelectVirtual);
    const getSizeCalls = await page.evaluate(() => window.selectVirtualEdge!.getSizeCalls());
    const actual = { ...projection, getSizeCalls };
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('AutoComplete edge window, callbacks or lazy getSize sequence did not settle');
}

for (const entry of reference.cases) {
  test(`${entry.id} matches actual Source values and measured group frames`, async (
    { page },
    testInfo
  ) => {
    await page.goto(`/select-virtual-edge.html?sample=${entry.id}`);
    await page.waitForFunction(() => window.selectVirtualEdge);

    await expect(page.locator('[data-select-virtual-case]')).toHaveAttribute(
      'data-select-virtual-bound',
      'true'
    );
    await prepareSelectVirtual(page);
    const identity = await page.evaluateHandle(() => {
      const refs = window.selectVirtualEdge!.refs();
      return { ...refs, parent: refs.editor!.parentNode, owner: document.querySelector('[data-select-virtual-case]')!,
        focus: refs.control!.focus, blur: refs.control!.blur, scrollTo: refs.control!.scrollTo,
        popups: [] as HTMLElement[], holders: [] as HTMLElement[] };
    });
    const bindings = () => identity.evaluate(old => {
      const refs = window.selectVirtualEdge!.refs();
      for (const popup of document.querySelectorAll<HTMLElement>('.ant-select-dropdown')) {
        if (!old.popups.includes(popup)) old.popups.push(popup);
        for (const holder of popup.querySelectorAll<HTMLElement>('[class$="-list-holder"]')) {
          if (!old.holders.includes(holder)) old.holders.push(holder);
        }
      }
      return { root: old.root === refs.root, anchor: old.anchor === refs.anchor, editor: old.editor === refs.editor,
        parent: old.parent === refs.editor!.parentNode, control: old.control === refs.control,
        publicRoot: refs.publicRoot === refs.root, publicEditor: refs.publicEditor === refs.editor,
        focus: old.focus === refs.control!.focus, blur: old.blur === refs.control!.blur,
        scrollTo: old.scrollTo === refs.control!.scrollTo };
    });
    const stableBindings = { root: true, anchor: true, editor: true, parent: true, control: true,
      publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true };
    const trace: unknown[] = [];
    try {
      const initial = await settle(page);
      trace.push({ phase: 'initial', actual: initial });
      expect(initial.view).toEqual(selectVirtualNativeView(entry.initial.view, entry.id, 'initial'));
      expect(initial.getSizeCalls).toEqual([]);
      expect(initial.raw.methods).toEqual({ focus: true, blur: true, scrollTo: true });
      expect(initial.raw.renders).toEqual(entry.initial.raw.renders);
      expect(await bindings()).toEqual(stableBindings);
      for (const step of entry.steps) {
        if (step.action.type === 'edge-group-ref') {
          await page.evaluate(() => {
            const control = window.selectVirtualEdge!.refs().control!;
            const calls = window.selectVirtualEdge!.getSizeCalls();
            control.scrollTo({ key: 'g-1', align: 'top', offset(info) {
              calls.push({
                align: info.align ?? null,
                first: info.getSize('g-0'),
                second: info.getSize('g-1')
              });
              return 0;
            } });
          });
        }
        else {
          await actSelectVirtual(page, step.action);
        }
        const actual = await settle(page);
        trace.push({ action: step.action, actual });
        // These new IDs can use only the existing unassigned-index ARIA boundary.
        expect(actual.view, JSON.stringify(step.action)).toEqual(selectVirtualNativeView(
          step.view,
          entry.id
        ));
        expect(
          actual.getSizeCalls,
          `all original callback invocations: ${JSON.stringify(step.action)}`
        ).toEqual(step.getSizeCalls);
        expect(actual.raw.renders).toEqual(step.raw.renders);
        expect(actual.view.leaks).toEqual([]);
        expect(await bindings()).toEqual(stableBindings);
        expect(await page.evaluate(readSelectVirtualAriaIntegrity)).toBe(true);
      }
      const final = entry.steps.at(-1)!;
      expect(await page.evaluate(() => ({ focused: document.activeElement === window.selectVirtualEdge!.refs().editor,
        activeTag: document.activeElement?.tagName ?? null })))
        .toEqual({
          focused: entry.beforeUnmount.editorFocused,
          activeTag: entry.beforeUnmount.activeTag
        });
      expect(entry.beforeUnmount.focusKind).toBeNull();
      await page.evaluate(() => window.selectVirtualEdge!.dispose());
      const disposed = () => page.evaluate(() => ({
        cleaned: window.selectVirtualEdge!.cleaned, callbacks: window.selectVirtualEdge!.events(),
        getSizeCalls: window.selectVirtualEdge!.getSizeCalls(), model: window.selectVirtualEdge!.model(),
        query: window.selectVirtualEdge!.query(), receipts: window.selectVirtualEdge!.receipts()
      }));
      const expected = { cleaned: {
        root: true,
        anchor: true,
        editor: true,
        control: true,
        publicRoot: true,
        publicEditor: true
      },
        callbacks: entry.cleanup.callbacks, getSizeCalls: final.getSizeCalls,
        model: final.view.model, query: final.view.query, receipts: final.view.receipts };
      expect(await disposed()).toEqual(expected);
      expect(await identity.evaluate(old => ({ rootConnected: old.root!.isConnected, anchorConnected: old.anchor!.isConnected,
        editorConnected: old.editor!.isConnected, popupConnected: old.popups.some(node => node.isConnected),
        ownerConnected: old.owner.isConnected }))).toEqual({ rootConnected: entry.cleanup.rootConnected,
          anchorConnected: entry.cleanup.anchorConnected, editorConnected: entry.cleanup.editorConnected,
          popupConnected: entry.cleanup.popupConnected, ownerConnected: false });
      await expect(page.locator('.ant-select-dropdown')).toHaveCount(0);
      await page.waitForTimeout(0);
      expect(await disposed()).toEqual(expected);
      await identity.evaluate(old => {
        for (const holder of old.holders) {
          holder.dispatchEvent(new UIEvent(
            'scroll',
            { bubbles: true }
          ));
        }
        old.editor!.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForTimeout(1000);
      expect(await disposed()).toEqual(expected);
    } finally {
      await testInfo.attach(
        'actual-virtual-edge-and-getSize-sequence',
        { body: JSON.stringify(trace, null, 2), contentType: 'application/json' }
      );
      await identity.dispose();
    }
  });
}
