import type { Page } from '@playwright/test';
import { test, expect } from './test';
import { drainSelectSurface } from './select-surface-driver';
import { decodeSelectSurface } from './select-surface-receipts';
import { selectCustomTagPrefixGeometry, selectCustomTagPrefixSamples } from './select-components-responsive-tag-prefix-cases.mjs';
import { installSelectTagClosePortTracker } from './select-components-tag-close-ports';
import { readSelectTagCloseKeyCounter } from './select-components-tag-close-key-reference';

const source = readSelectTagCloseKeyCounter(), sample = selectCustomTagPrefixSamples[0];
test.use({ viewport: selectCustomTagPrefixGeometry.viewport });
const read = (page: Page) => page.evaluate(() => {
  const owner = window.customTagPrefixNative.read(), refs = window.customTagPrefixNative.readRefs();
  return { owner: { alive: owner.alive, open: owner.open, query: owner.query, model: owner.model,
    events: owner.events, rawEvents: owner.rawEvents, lifecycle: owner.lifecycle, producerCount: owner.calls.length,
    bodyActivityCount: owner.bodyActivity.length, componentObservationCount: owner.componentObservations.length },
    refs: Object.fromEntries(Object.entries(refs).map(([name, value]) => [name, value == null])),
    owners: document.querySelectorAll('[data-surface-case]').length,
    popups: document.querySelectorAll('.ant-select-dropdown').length, ports: window.selectTagClosePorts.snapshot() };
});
const kinds = (events: unknown[]) => events.map(event => (decodeSelectSurface(event) as unknown[])[0]);
for (const original of source.cases) test(`Select pending custom tag close follows Original key ${original.id}`, async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [], errors: string[] = [], networkFailures: unknown[] = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on(
    'requestfailed',
    request => networkFailures.push({ url: request.url(), failure: request.failure() })
  );
  page.on('response', response => {
    if (response.status() >= 400) {
      networkFailures.push({
        url: response.url(),
        status: response.status()
      });
    }
  });
  let disposed = false;
  // Убирает компонент при незавершённом сценарии и фиксирует сбой удаления.
  async function disposeAfterFailure() {
    try {
    await page.evaluate(() => window.customTagPrefixNative.dispose());
    }
    catch (error) {
    errors.push(String(error));
    }
  }

  try {
    await page.addInitScript(installSelectTagClosePortTracker);
    await page.goto('/select-components-responsive-tag-prefix.html?sample=' + encodeURIComponent(sample.id));
    await page.addScriptTag({
      type: 'module',
      url: '/select-components-responsive-tag-prefix.client.ts'
    });
    await page.waitForFunction(() => window.customTagPrefixNative?.ready === true);
    await drainSelectSurface(page);
    await page.evaluate(() => window.customTagPrefixNative.readRefs().editor!.focus());
    await drainSelectSurface(page);
    const before = await read(page);
    trace.push({ phase: 'before', actual: before });
    expect(before.owner.open).toBe(original.beforeOpen);
    expect(kinds(before.owner.events)).toEqual(original.eventKindsBefore);
    expect(before.ports.activePorts).toBe(0);
    const immediate = await page.evaluate(key => {
      const api = window.customTagPrefixNative, refs = api.readRefs(), editor = refs.editor, root = refs.root;
      const button = root?.querySelector<HTMLButtonElement>('[data-custom-tag-close="a"]');
      if (!button || !editor) {
        throw Error('Actual authored tag button and public editor are required');
      }
      window.selectTagClosePorts.mark('key-counter');
      button.dispatchEvent(new MouseEvent(
        'mousedown',
        { bubbles: true, cancelable: true, view: window }
      ));
      const pending = window.selectTagClosePorts.snapshot();
      const event = new KeyboardEvent('keydown', { ...key, bubbles: true, cancelable: true });
      editor.dispatchEvent(event);
      return { pending, ports: window.selectTagClosePorts.snapshot(), open: api.read().open,
        events: api.read().events, actualKey: {
          key: event.key,
          code: event.code,
          which: event.which,
          keyCode: event.keyCode,
          ctrlKey: event.ctrlKey
        },
        rootUnchanged: root === api.readRefs().root, editorUnchanged: editor === api.readRefs().editor };
    }, original.key);
    trace.push({ phase: 'same-task', actual: immediate });
    expect(immediate.pending.activePorts).toBe(2);
    expect(immediate.open).toBe(original.immediateOpen);
    expect(immediate.actualKey).toEqual(original.key);
    expect(immediate.rootUnchanged && immediate.editorUnchanged).toBe(true);
    expect(kinds(immediate.events)).toEqual(original.eventKindsAfterKeyboard);
    expect(immediate.ports.activePorts).toBe(original.settledOpen ? 0 : 2);
    await drainSelectSurface(page);
    const settled = await read(page);
    trace.push({ phase: 'settled', actual: settled });
    expect(settled.owner.open).toBe(original.settledOpen);
    expect(kinds(settled.owner.events)).toEqual(original.eventKindsSettled);
    expect(settled.owner.model).toEqual(before.owner.model);
    expect(settled.owner.query).toBe(before.owner.query);
    expect(settled.ports.createdPorts).toBe(2);
    expect(settled.ports.closedPorts).toBe(2);
    expect(settled.ports.activePorts).toBe(0);
    await page.evaluate(() => window.customTagPrefixNative.dispose());
    disposed = true;
    await drainSelectSurface(page);
    const cleanup = await read(page);
    trace.push({ phase: 'cleanup', actual: cleanup });
    expect(cleanup.owners).toBe(0);
    expect(cleanup.popups).toBe(0);
    expect(cleanup.owner.alive).toBe(false);
    expect(Object.values(cleanup.refs).every(Boolean)).toBe(true);
    expect(cleanup.ports.activePorts).toBe(0);
    await page.waitForTimeout(1000);
    const late = await read(page);
    trace.push({ phase: 'late-1000ms', actual: late });
    expect(late).toEqual(cleanup);
    expect(errors).toEqual([]);
    expect(networkFailures).toEqual([]);
  } finally {
    if (!disposed) {
      await disposeAfterFailure();
    }
    await testInfo.attach('select-custom-tag-close-key-counter.json', { contentType: 'application/json',
      body: JSON.stringify({ id: original.id, source: original, trace, errors, networkFailures,
        SourceResourceClaim: 'none; real Source counters remain unmeasured' }, null, 2) });
  }
});
