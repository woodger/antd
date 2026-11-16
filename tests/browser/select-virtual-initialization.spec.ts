import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { test, expect } from './test';
import type { SelectVirtualAction } from './fixtures/select-virtual-cases';
import { actSelectVirtual, drainSelectVirtual, prepareSelectVirtual } from './select-virtual-driver';
import { readSelectVirtual } from './select-virtual-metrics';
import { selectVirtualNativeView, readSelectVirtualAriaIntegrity } from './select-virtual-native';

interface ScrollReceipt {
  phase: string; trusted: boolean; bubbles: boolean; targetTag: string | null; classes: string[];
  connected: boolean | null; sameSavedHolder: boolean; top: number | null; left: number | null;
  clientHeight: number | null; scrollHeight: number | null; ownerCallbacksBeforeEvent: number;
}
interface Observation {
  projection: ReturnType<typeof readSelectVirtual>; callbacks: unknown[][]; offsets: unknown[]; domScrolls: ScrollReceipt[];
}
interface HolderReceipt { top: number; clientHeight: number; scrollHeight: number; sameSavedHolder: boolean }
interface FrameObservation extends Observation { before: HolderReceipt; after: HolderReceipt; calls: unknown[] }
interface SourceInitialization {
  reference: { version: string; react: string; errors: unknown[]; diagnostics: unknown[] };
  cases: Array<{ id: string; sourceSampleId: string; variant: 'api-same' | 'api-roundtrip' | 'manual-untrusted' | 'reopen-only';
    initial: Observation; setup: Array<Observation & { action: SelectVirtualAction }>;
    inFrame: FrameObservation; afterAwait: Observation; cleanup: {
      rootConnected: boolean; editorConnected: boolean; popupConnected: boolean; holderConnected: boolean;
      callbacks: unknown[][]; domScrolls: ScrollReceipt[] } }>;
}
declare global {
  interface Window {
    selectVirtualInitializationProbe?: {
      phase: string; scrolls: ScrollReceipt[]; holder: HTMLElement | null;
      read: () => Observation; stop: () => void;
    };
  }
}
const bytes = readFileSync(new URL('./fixtures/ant-design-select-virtual-initialization-reference.json', import.meta.url));
if (createHash('sha256').update(bytes).digest('hex') !== 'c98e17f2203792f37c0bb175c3c78f5ab04cb9f6f94e9e778e9875da4a803bfc')
  throw Error('Frozen actual Source initialization capture changed');
const reference = JSON.parse(bytes.toString('utf8')) as SourceInitialization;
const variants = ['api-same', 'api-roundtrip', 'manual-untrusted', 'reopen-only'];

test.use({ viewport: { width: 1200, height: 900 } });
test.beforeAll(() => {
  expect(reference.reference).toMatchObject({ version: '6.6.8', react: '18.3.1', errors: [], diagnostics: [] });
  expect(reference.cases.map(entry => entry.id)).toEqual(['select', 'auto-complete']
    .flatMap(family => variants.map(variant => `${family}-initialization-${variant}`)));
  for (const entry of reference.cases) {
    expect(entry.sourceSampleId).toBe(`${entry.id.startsWith('select-') ? 'select' : 'auto-complete'}-ref-closed`);
    expect(entry.setup.map(step => step.action)).toEqual([
      { type: 'click' }, { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
      { type: 'open', value: false }
    ]);
    expect(entry.inFrame.projection.view.popup?.box?.x).toBe(-12000);
    expect(entry.inFrame.projection.view.popup?.box?.y).toBe(-9000);
    const delta = entry.afterAwait.callbacks.slice(entry.setup.at(-1)!.callbacks.length);
    expect(delta).toEqual(entry.variant === 'api-same' || entry.variant === 'reopen-only' ? [] : [['scroll', {
      trusted: entry.variant === 'api-roundtrip', tag: 'DIV', holder: true, top: 572, left: 0,
      clientHeight: 100, scrollHeight: 3200
    }]]);
  }
});

/** Source is still offscreen in this first public frame; physical boxes stay diagnostic. */
function logicalFrameView(view: ReturnType<typeof readSelectVirtual>['view']) {
  const withoutBox = <T extends { box: unknown }>(node: T | null) => {
    if (!node) return null;
    const { box: _box, ...logical } = node;
    return logical;
  };
  return { ...view, popup: view.popup ? { placement: view.popup.placement, viewport: {
    holder: withoutBox(view.popup.viewport.holder), filler: withoutBox(view.popup.viewport.filler),
    inner: withoutBox(view.popup.viewport.inner), rows: view.popup.viewport.rows.map(row => withoutBox(row)),
    aria: view.popup.viewport.aria.map(listbox => withoutBox(listbox)),
    scrollbars: view.popup.viewport.scrollbars.map(({ box: _box, thumb, ...logical }) => ({ ...logical, thumbPresent: Boolean(thumb) }))
  } } : null };
}

async function settle(page: Page) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectVirtual(page);
    const actual = await page.evaluate(() => window.selectVirtualInitializationProbe!.read());
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Public initialization frame and callback ledger did not settle');
}

for (const entry of reference.cases) {
  test(`${entry.id} preserves public callbacks during initialization`, async ({ page }, testInfo) => {
    await page.goto(`/select-virtual-initialization.html?sample=${entry.sourceSampleId}`);
    await page.waitForFunction(() => window.selectVirtualInitialization);
    await expect(page.locator('[data-select-virtual-case]')).toHaveAttribute('data-select-virtual-bound', 'true');
    await page.evaluate(project => {
      const readProjection = new Function(`return (${project})`)() as typeof readSelectVirtual;
      const probe: NonNullable<Window['selectVirtualInitializationProbe']> = {
        phase: 'mount', scrolls: [], holder: null,
        read: () => ({ projection: readProjection(), callbacks: window.selectVirtualInitialization!.events(),
          offsets: window.selectVirtualInitialization!.offsets(), domScrolls: probe.scrolls }),
        stop: () => document.removeEventListener('scroll', record, true)
      };
      const record = (event: Event) => {
        const target = event.target;
        const node = target instanceof Document ? target.scrollingElement : target;
        const element = node instanceof HTMLElement ? node : null;
        probe.scrolls.push({ phase: probe.phase, trusted: event.isTrusted, bubbles: event.bubbles,
          targetTag: target instanceof Document ? '#document' : element?.tagName ?? null,
          classes: element ? [...element.classList] : [], connected: element?.isConnected ?? null,
          sameSavedHolder: Boolean(element && element === probe.holder), top: element?.scrollTop ?? null,
          left: element?.scrollLeft ?? null, clientHeight: element?.clientHeight ?? null,
          scrollHeight: element?.scrollHeight ?? null,
          ownerCallbacksBeforeEvent: window.selectVirtualInitialization!.events().length });
      };
      document.addEventListener('scroll', record, true);
      window.selectVirtualInitializationProbe = probe;
    }, readSelectVirtual.toString());
    const trace: unknown[] = [];
    try {
      await prepareSelectVirtual(page);
      const initial = await settle(page);
      trace.push({ phase: 'initial', actual: initial });
      expect(initial.projection.view).toEqual(selectVirtualNativeView(entry.initial.projection.view, entry.sourceSampleId, 'initial'));
      expect(initial.callbacks).toEqual(entry.initial.callbacks);
      expect(initial.offsets).toEqual(entry.initial.offsets);
      for (const [index, step] of entry.setup.entries()) {
        await page.evaluate(phase => { window.selectVirtualInitializationProbe!.phase = phase; }, `setup-${index}`);
        await actSelectVirtual(page, step.action);
        const actual = await settle(page);
        trace.push({ action: step.action, actual });
        expect(actual.projection.view).toEqual(selectVirtualNativeView(step.projection.view, entry.sourceSampleId, 'step', step.action));
        expect(actual.callbacks).toEqual(step.callbacks);
        expect(actual.offsets).toEqual(step.offsets);
        if (index === 0) await page.evaluate(() => {
          window.selectVirtualInitializationProbe!.holder = document.querySelector('.ant-select-dropdown-list-holder');
        });
      }
      const inFrame = await page.evaluate(async variant => {
        const probe = window.selectVirtualInitializationProbe!;
        probe.phase = 'reopen-public-frame';
        document.querySelector('[data-select-virtual-command]')!
          .dispatchEvent(new CustomEvent('virtualupdate', { detail: { type: 'open', value: true } }));
        return await new Promise<FrameObservation>(resolve => {
          const frame = () => {
            const holder = document.querySelector<HTMLElement>('.ant-select-dropdown-list-holder');
            if (!holder?.clientHeight) { requestAnimationFrame(frame); return; }
            const control = window.selectVirtualInitialization!.refs().control!;
            const measure = (): HolderReceipt => ({ top: holder.scrollTop, clientHeight: holder.clientHeight,
              scrollHeight: holder.scrollHeight, sameSavedHolder: holder === probe.holder });
            const before = measure();
            const calls: unknown[] = [];
            if (variant === 'api-same') { calls.push({ method: 'scrollTo', argument: 20 }); control.scrollTo(20); }
            else if (variant === 'api-roundtrip') {
              calls.push({ method: 'scrollTo', argument: { top: 600 } }); control.scrollTo({ top: 600 });
              calls.push({ method: 'scrollTo', argument: { top: 572 } }); control.scrollTo({ top: 572 });
            } else if (variant === 'manual-untrusted') {
              calls.push({ method: 'dispatchEvent', event: 'scroll', bubbles: true });
              holder.dispatchEvent(new UIEvent('scroll', { bubbles: true }));
            }
            resolve({ before, calls, after: measure(), ...probe.read() });
          };
          requestAnimationFrame(frame);
        });
      }, entry.variant);
      trace.push({ phase: 'first-positive-holder-public-frame', source: entry.inFrame, actual: inFrame,
        scope: 'Physical boxes are diagnostic until Source align finishes; calls, holder metrics, full callback/offset ledgers and logical rows/ARIA remain strict.' });
      expect(inFrame.calls).toEqual(entry.inFrame.calls);
      const sameSavedHolder = entry.sourceSampleId.startsWith('auto-complete-');
      expect(inFrame.before).toEqual({ ...entry.inFrame.before, sameSavedHolder });
      expect(inFrame.after).toEqual({ ...entry.inFrame.after, sameSavedHolder });
      expect(logicalFrameView(inFrame.projection.view))
        .toEqual(logicalFrameView(selectVirtualNativeView(entry.inFrame.projection.view, entry.sourceSampleId)));
      expect(inFrame.callbacks).toEqual(entry.inFrame.callbacks);
      expect(inFrame.offsets).toEqual(entry.inFrame.offsets);
      const afterAwait = await settle(page);
      trace.push({ phase: 'after-await', actual: afterAwait });
      expect(afterAwait.projection.view).toEqual(selectVirtualNativeView(entry.afterAwait.projection.view, entry.sourceSampleId));
      expect(afterAwait.callbacks).toEqual(entry.afterAwait.callbacks);
      expect(afterAwait.offsets).toEqual(entry.afterAwait.offsets);
      expect(await page.evaluate(readSelectVirtualAriaIntegrity)).toBe(true);
      const beforeCallbacks = entry.setup.at(-1)!.callbacks.length;
      const delta = afterAwait.callbacks.slice(beforeCallbacks);
      expect(delta).toEqual(entry.afterAwait.callbacks.slice(beforeCallbacks));
      for (const [index, event] of delta.entries()) {
        const receipt = event[1] as { trusted: boolean; top: number; left: number; clientHeight: number; scrollHeight: number };
        expect(event[0]).toBe('scroll');
        expect(afterAwait.domScrolls.some(scroll => scroll.phase === 'reopen-public-frame'
          && scroll.ownerCallbacksBeforeEvent === beforeCallbacks + index && scroll.connected
          && scroll.trusted === receipt.trusted && scroll.top === receipt.top && scroll.left === receipt.left
          && scroll.clientHeight === receipt.clientHeight && scroll.scrollHeight === receipt.scrollHeight)).toBe(true);
      }
      // The Native conditional Select remount produces a real restoration scroll event.
      // Keep it in the capture; only public callback deltas are compared to the retained Source holder.
      if (!sameSavedHolder) expect(afterAwait.domScrolls.some(scroll => scroll.phase === 'reopen-public-frame'
        && scroll.trusted && scroll.connected && !scroll.sameSavedHolder && scroll.top === 572)).toBe(true);
      expect(entry.cleanup.callbacks).toEqual(entry.afterAwait.callbacks);
      const disposedEvents = [...afterAwait.callbacks, ['open', false]];
      const disposed = await page.evaluate(async () => {
        const state = window.selectVirtualInitialization!;
        const refs = state.refs();
        const popup = document.querySelector('.ant-select-dropdown')!;
        const holder = window.selectVirtualInitializationProbe!.holder!;
        window.selectVirtualInitializationProbe!.phase = 'unmount';
        await state.dispose();
        return { rootConnected: refs.root!.isConnected, editorConnected: refs.editor!.isConnected,
          popupConnected: popup.isConnected, holderConnected: holder.isConnected,
          cleaned: state.cleaned, callbacks: state.events(), domScrolls: window.selectVirtualInitializationProbe!.scrolls };
      });
      trace.push({ phase: 'disposed', actual: disposed });
      expect({ ...disposed, domScrolls: undefined }).toEqual({ rootConnected: false, editorConnected: false,
        popupConnected: false, holderConnected: false,
        cleaned: { root: true, editor: true, control: true, publicRoot: true, publicEditor: true },
        callbacks: disposedEvents, domScrolls: undefined });
      await expect(page.locator('.ant-select-dropdown')).toHaveCount(0);
      await page.waitForTimeout(0);
      expect(await page.evaluate(() => window.selectVirtualInitialization!.events())).toEqual(disposedEvents);
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => window.selectVirtualInitialization!.events())).toEqual(disposedEvents);
    } finally {
      await testInfo.attach('actual-initialization-dom-and-callbacks', {
        body: JSON.stringify(trace, null, 2), contentType: 'application/json'
      });
      await page.evaluate(() => window.selectVirtualInitializationProbe?.stop());
    }
  });
}
