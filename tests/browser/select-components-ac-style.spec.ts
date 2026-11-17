import { test, expect } from './test';
import { prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { selectIconsGeometry } from './select-components-ac-style-cases.mjs';
import { selectComponentsACStyleSamples as selectComponentsSamples, readSelectComponentsACStyleCase } from './select-components-ac-style-reference';
import { settleNativeSelectComponentsACStyle as settleNativeSelectComponents, verifySelectComponentsACStylePoint as verifySelectComponentsPoint } from './select-components-ac-style-assertions';
import type { ComponentProps } from 'svelte';
import type SelectComponentsACStyleCase from './fixtures/SelectComponentsACStyleCase.svelte';
type Capture = Required<NonNullable<ComponentProps<typeof SelectComponentsACStyleCase>['capture']>> & { dispose: () => void };
function removalBlurPayload(tag: string) {
  return { type: 'focusout', key: { $: 'undefined' }, defaultPrevented: false,
    propagationStopped: false, target: tag, currentTarget: 'DIV' };
}
function verifyRemovalBlurRaw(value: unknown, tag: string) {
  const graph = value as { root: { ref: number }; objects: Array<{ id: number }> };
  expect(graph.objects).toHaveLength(2);
  const root = graph.root.ref, payload = graph.objects[1].id;
  expect(Number.isInteger(root) && root > 0).toBe(true); expect(payload).toBe(root + 1);
  const descriptor = (key: string, valueType: string, enumerable = true, configurable = true) =>
    ({ key, enumerable, configurable, writable: true, kind: 'value', valueType });
  expect(graph).toEqual({ root: { ref: root }, objects: [
    { id: root, type: 'object', array: true, authoredRole: null,
      ownProperties: [descriptor('0', 'string'), descriptor('1', 'object'), descriptor('length', 'number', false, false)],
      properties: [{ key: '0', value: 'public-blur' }, { key: '1', value: { ref: payload } }, { key: 'length', value: 2 }] },
    { id: payload, type: 'object', array: false, authoredRole: null,
      ownProperties: Object.entries(removalBlurPayload(tag)).map(([key, value]) => descriptor(key, key === 'key' ? 'undefined' : typeof value)),
      properties: Object.entries(removalBlurPayload(tag)).map(([key, value]) => ({ key, value })) }
  ] });
}
test.use({ viewport: selectIconsGeometry.viewport });
for (const sample of selectComponentsSamples) test(`AutoComplete component style complete Original ${sample.id}`, async ({ page }, testInfo) => {
  const source = readSelectComponentsACStyleCase(sample.id);
  const trace: unknown[] = [], failures: string[] = [];
  await page.goto('/?fixture=select-components-ac-style');
  await page.getByRole('combobox', { name: 'Select component AC style sample', exact: true }).selectOption(sample.id);
  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-case', sample.id);
  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-components-bound', 'true');
  await prepareSelectSurface(page);
  const capture = await page.evaluateHandle(() => {
    const detail = {} as Capture;
    document.querySelector('[data-select-components-fixture-command]')!.dispatchEvent(new CustomEvent('selectcomponentscapture', { detail }));
    if (!detail.read || !detail.readRefs || !detail.readNativeBlurChecks || !detail.update || !detail.dispose) throw Error('Complete actual component bridge required');
    Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
    return detail;
  });
  const verify = async (point: typeof source.initial, label: string) => {
    const actual = await settleNativeSelectComponents(page); trace.push({ label, actual });
    failures.push(...verifySelectComponentsPoint(actual, point, source, sample, label));
  };
  const editor = async () => {
    const handle = await capture.evaluateHandle(owner => owner.readRefs().editor);
    const element = handle.asElement(); if (!element) throw Error('Actual public editor ref absent');
    return element;
  };
  try {
    await verify(source.initial, 'initial');
    for (const [index, step] of source.steps.entries()) {
      const action = sample.actions[index]; expect(action).toEqual(step.action);
      if (action.type === 'props' || action.type === 'context' || action.type === 'inner' || action.type === 'model')
        await capture.evaluate((owner, value) => owner.update(value.action, value.index), { action, index });
      else if (action.type === 'focus-method') await capture.evaluate((owner, options) => owner.readRefs().control!.focus(options), 'options' in action ? action.options : undefined);
      else if (action.type === 'blur-method') await capture.evaluate(owner => owner.readRefs().control!.blur());
      else if (action.type === 'outside') await page.locator('[data-surface-outside]').click();
      else if (action.type === 'root-click') {
        const handle = await capture.evaluateHandle(owner => owner.readRefs().root);
        const element = handle.asElement(); if (!element) throw Error('Actual public root ref absent');
        await element.click(); await handle.dispose();
      } else if (action.type === 'fill' || action.type === 'component-key') {
        const element = await editor();
        if (action.type === 'fill') await element.fill(action.text); else await element.press(action.key);
        await element.dispose();
      } else if (action.type === 'remove') {
        await page.locator('.ant-select-selection-item').filter({ hasText: action.value }).locator('.ant-select-selection-item-remove').click();
      } else if (action.type === 'clear') {
        const button = page.locator('.ant-select-clear');
        if (action.activation === 'pointer') await button.click(); else { await button.focus(); await button.press(action.activation); }
      } else throw Error('Unknown frozen AC style action ' + action.type);
      await page.mouse.move(0, 0);
      await verify(step, index + '/' + JSON.stringify(action));
    }
    const before = await capture.evaluate(owner => owner.read());
    const beforeBlurChecks = await capture.evaluate(owner => owner.readNativeBlurChecks());
    await capture.evaluate(owner => owner.dispose());
    await expect(page.locator('[data-surface-case]')).toHaveCount(0); await drainSelectSurface(page);
    const cleanup = async () => ({ owner: await capture.evaluate(owner => owner.read()),
      refs: await capture.evaluate(owner => Object.fromEntries(Object.entries(owner.readRefs()).map(([key, value]) => [key, value == null]))),
      retained: await page.evaluate(() => {
        const observer = (globalThis as unknown as { raw: { iconsObserver: { retained: Map<number, Node> } } }).raw.iconsObserver;
        return [...observer.retained].map(([id, node]) => ({ id, connected: node.isConnected }));
      }), popupCount: await page.locator('.ant-select-dropdown').count(),
      nativeBlurChecks: await capture.evaluate(owner => owner.readNativeBlurChecks()) });
    const disposed = await cleanup(); trace.push({ label: 'disposed', actual: disposed });
    await page.waitForTimeout(1000);
    const lateDisposed = await cleanup(); trace.push({ label: 'late-disposed', actual: lateDisposed });
    expect(disposed.popupCount).toBe(0); expect(disposed.retained.every(n => !n.connected)).toBe(true);
    expect(Object.values(disposed.refs).every(Boolean)).toBe(true); expect(disposed.owner.alive).toBe(false);
    // Existing Svelte connected-parent removal dispatches one real focusout;
    // the immutable Original independently removes without a public blur. This
    // is the same explicitly measured Native boundary as components hydration.
    const finalSource = source.steps.at(-1)!.owner;
    expect(source.cleanup.events).toEqual(source.events.slice(0, finalSource.eventCount));
    expect(source.cleanup.rawEvents).toEqual(source.rawEvents.slice(0, finalSource.rawEventCount));
    expect(source.cleanup.producerCalls).toEqual(source.producerCalls.slice(0, finalSource.producerCount));
    expect(source.late.events).toEqual(source.cleanup.events); expect(source.late.rawEvents).toEqual(source.cleanup.rawEvents);
    expect(source.late.producerCalls).toEqual(source.cleanup.producerCalls);
    const tag = sample.settings.componentTag === 'textarea' ? 'TEXTAREA' : 'INPUT';
    const encodedBlur = { $: 'array', properties: [{ key: '0', value: 'public-blur' },
      { key: '1', value: { $: 'object', properties: Object.entries(removalBlurPayload(tag)).map(([key, value]) => ({ key, value })) } },
      { key: 'length', value: 2 }] };
    expect(disposed.owner.events.slice(0, before.events.length)).toEqual(before.events);
    expect(disposed.owner.events.slice(before.events.length)).toEqual([encodedBlur]);
    expect(disposed.owner.rawEvents.slice(0, before.rawEvents.length)).toEqual(before.rawEvents);
    expect(disposed.owner.rawEvents).toHaveLength(before.rawEvents.length + 1);
    verifyRemovalBlurRaw(disposed.owner.rawEvents.at(-1), tag);
    expect(disposed.owner.calls).toEqual(before.calls);
    expect(disposed.nativeBlurChecks.slice(0, beforeBlurChecks.length)).toEqual(beforeBlurChecks);
    expect(disposed.nativeBlurChecks.slice(beforeBlurChecks.length)).toEqual([{
      type: 'focusout', stack: expect.stringContaining('Native AC style blur observation'),
      target: { tag, connected: true }, currentTarget: { tag: 'DIV', connected: true }, relatedTarget: null,
      activeElement: { tag: 'BODY', connected: true }, owner: { alive: true, open: false },
      currentTargetIsPublicRoot: true, targetIsPublicEditor: true,
      boundRoot: { tag: 'DIV', connected: true }, boundEditor: { tag, connected: true }
    }]);
    expect(lateDisposed).toEqual(disposed);
    expect(failures).toEqual([]);
  } finally {
    await testInfo.attach('actual-select-components-ac-style-complete-raw', { body: JSON.stringify({ sample, trace, failures }, null, 2), contentType: 'application/json' });
    await capture.dispose();
  }
});
