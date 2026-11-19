import type { Page } from '@playwright/test';
import { test, expect } from './test';
import { drainSelectSurface } from './select-surface-driver';
import { decodeSelectSurface } from './select-surface-receipts';
import { selectCustomTagPrefixSamples, selectCustomTagPrefixGeometry } from './select-components-responsive-tag-prefix-cases.mjs';
import type { SelectCustomTagPrefixNativeAPI } from './select-components-responsive-tag-prefix-metrics.mjs';
import { installSelectTagClosePortTracker, type SelectTagClosePortSnapshot } from './select-components-tag-close-ports';
// Both Source mode owners use this same queue. The full uninstrumented Original
// comparison covers both; these three Native-only cases protect resource ownership.
test.use({ viewport: selectCustomTagPrefixGeometry.viewport });
const sample = selectCustomTagPrefixSamples[0];
const read = (page: Page) => page.evaluate(() => {
  const api: SelectCustomTagPrefixNativeAPI = window.customTagPrefixNative, owner = api.read(), refs = api.readRefs();
  return { owner: { alive: owner.alive, open: owner.open, query: owner.query, model: owner.model,
    events: owner.events, rawEvents: owner.rawEvents, lifecycle: owner.lifecycle, producerCount: owner.calls.length,
    bodyActivityCount: owner.bodyActivity.length, componentObservationCount: owner.componentObservations.length,
    refs: Object.fromEntries(Object.entries(refs).map(([name, node]) => [name, node == null])),
    owners: document.querySelectorAll('[data-surface-case]').length, popups: document.querySelectorAll('.ant-select-dropdown').length },
    ports: window.selectTagClosePorts.snapshot() };
});
function closedPair(ports: SelectTagClosePortSnapshot, phase: string) {
  const selected = ports.records.filter(value => value.phase === phase);
  expect(selected).toHaveLength(2);
  expect(selected.every(value => value.closed)).toBe(true);
  expect(ports.activePorts).toBe(0);
  expect(ports.closedPorts).toBe(ports.createdPorts);
}
function eventNames(events: unknown[]) {
  return events.map(row => (decodeSelectSurface(row) as unknown[])[0]);
}
for (const mode of ['normal-close', 'cancel-with-escape', 'immediate-unmount'] as const)
  test(`Select custom tag close releases MessageChannel ${mode}`, async ({ page }, testInfo) => {
    const trace: unknown[] = [], diagnostics: unknown[] = [], networkFailures: unknown[] = [];
    page.on(
      'console',
      message => diagnostics.push({
        type: message.type(),
        text: message.text(),
        location: message.location()
      })
    );
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
      expect(before.ports.activePorts).toBe(0);
      if (mode === 'normal-close') {
        await page.evaluate(phase => window.selectTagClosePorts.mark(phase), mode);
        await page.locator('[data-custom-tag-close="a"]').click();
        await drainSelectSurface(page);
        const actual = await read(page);
        trace.push({ phase: mode, actual });
        closedPair(actual.ports, mode);
        expect(eventNames(actual.owner.events).slice(before.owner.events.length)).toEqual([
          'tag-close-before', 'change', 'deselect', 'tag-close-after', 'open'
        ]);
        expect(actual.owner.open).toBe(false);
      }
      else {
        // Keep both public DOM events in one task so the close is genuinely pending.
        const pending = await page.evaluate(async mode => {
          window.selectTagClosePorts.mark(mode);
          const button = document.querySelector<HTMLButtonElement>('[data-custom-tag-close="a"]');
          if (!button) {
            throw Error('Actual authored close button is required');
          }
          button.dispatchEvent(new MouseEvent(
            'mousedown',
            { bubbles: true, cancelable: true, view: window }
          ));
          const pending = window.selectTagClosePorts.snapshot();
          if (mode === 'immediate-unmount') await window.customTagPrefixNative.dispose();
          else {
            const editor = window.customTagPrefixNative.readRefs().editor;
            if (!editor) {
              throw Error('Actual public editor is required');
            }
            editor.dispatchEvent(new KeyboardEvent(
              'keydown',
              { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }
            ));
          }
          return pending;
        }, mode);
        trace.push({ phase: 'pending-close', actual: pending });
        expect(pending.activePorts).toBe(2);
        const committed = await read(page);
        trace.push({ phase: 'after-cancel', actual: committed });
        await drainSelectSurface(page);
        const settled = await read(page);
        trace.push({ phase: 'settled-cancel', actual: settled });
        closedPair(settled.ports, mode);
        expect(settled.owner.events).toEqual(committed.owner.events);
      }
      if (mode !== 'immediate-unmount') await page.evaluate(() => window.customTagPrefixNative.dispose());
      await drainSelectSurface(page);
      const cleanup = await read(page);
      trace.push({ phase: 'cleanup', actual: cleanup });
      closedPair(cleanup.ports, mode);
      expect(cleanup.owner.owners).toBe(0);
      expect(cleanup.owner.popups).toBe(0);
      expect(Object.values(cleanup.owner.refs).every(Boolean)).toBe(true);
      expect(cleanup.owner.alive).toBe(false);
      // The existing synchronous Native disposal blur is captured before this boundary.
      await page.waitForTimeout(1000);
      const late = await read(page);
      trace.push({ phase: 'late-1000ms', actual: late });
      expect(late).toEqual(cleanup);
      expect(networkFailures).toEqual([]);
    } finally {
      await testInfo.attach('select-custom-tag-close-native-safety.json', { contentType: 'application/json',
        body: JSON.stringify({ sample: sample.id, mode, trace, diagnostics, networkFailures,
          SourceResourceClaim: 'none; Source browser port counts remain unmeasured' }, null, 2) });
    }
  });
