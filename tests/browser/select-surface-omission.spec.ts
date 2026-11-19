import { test, expect } from './test';
import { omissionGeometry } from './select-surface-omission-cases.mjs';
import { selectSurfaceOmissionNativeSamples } from './fixtures/select-surface-omission-native-cases';
import { selectSurfaceOmissionReference, selectSurfaceOmissionWidthReference,
  selectSurfaceOmissionDefaultReference } from './select-surface-omission-reference';
import { actSelectSurface, prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { decodeSelectSurface } from './select-surface-receipts';
import { createSelectSurfaceRecorder } from './select-surface-producers.mjs';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { settleNativeOmission, verifyNativeOmissionPoint, verifyOmissionLifecycle,
  type NativeSelectSurfaceOmissionOwner } from './select-surface-omission-native-assertions';

test.use({ viewport: omissionGeometry.viewport });
// Preserve the closed-width precursor in its complete reference, and compare the
// separate open-query experiment for actual nonempty query width measurements.
for (const original of [...selectSurfaceOmissionReference.cases.filter(entry => entry.initial.owner.axis === 'omission'),
  ...selectSurfaceOmissionWidthReference.cases, ...selectSurfaceOmissionDefaultReference.cases]) {
  test(`Select preserves actual popup omission and query width for ${original.id}`, async (
    { page },
    testInfo
  ) => {
    const sample = selectSurfaceOmissionNativeSamples.find(sample => sample.id === original.id)!;
    const trace: unknown[] = [], failures: string[] = [];
    await page.goto('/?fixture=select-surface-omission');
    await page.getByRole('combobox', { name: 'Select surface omission sample', exact: true }).selectOption(sample.id);

    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
    await prepareSelectSurface(page);
    const capture = await page.evaluateHandle(() => {
      const detail: { read?: () => NativeSelectSurfaceOmissionOwner; readRefs?: () => Record<string, unknown>;
        setAction?: (action: unknown) => void; dispose?: () => void } = {};
      document.querySelector('[data-surface-fixture-command]')!.dispatchEvent(new CustomEvent(
        'surfacecapture',
        { detail }
      ));
      if (!detail.read || !detail.readRefs || !detail.dispose || !detail.setAction) {
        throw Error('Actual omission capture missing');
      }
      // The byte-identical Original reader consumes this read-only adapter. The
      // Native methods object is preserved; separate bound refs are not grafted on.
      Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
      return {
        read: detail.read,
        readRefs: detail.readRefs,
        setAction: detail.setAction,
        dispose: detail.dispose
      };
    });
    const retained = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement; editor?: HTMLElement; control?: Record<string, unknown> } = {};
      document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
        'surfacerefs',
        { detail: refs }
      ));
      return {
        ...refs,
        parent: refs.editor?.parentNode,
        focus: refs.control?.focus,
        blur: refs.control?.blur,
        scrollTo: refs.control?.scrollTo
      };
    });
    let previous: {
      actual: Awaited<ReturnType<typeof settleNativeOmission>>;
      source: typeof original.initial
    } | undefined;
    const verify = async (source: typeof original.initial, label: string) => {
      const actual = await settleNativeOmission(page);
      trace.push({ label, actual });
      failures.push(...verifyNativeOmissionPoint(actual, source, original, sample, label, previous));
      expect(await retained.evaluate(before => {
        const refs: { root?: HTMLElement; editor?: HTMLElement; control?: Record<string, unknown> } = {};
        document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
          'surfacerefs',
          { detail: refs }
        ));
        return { root: refs.root === before.root, editor: refs.editor === before.editor, parent: refs.editor?.parentNode === before.parent,
          control: refs.control === before.control, focus: refs.control?.focus === before.focus,
          blur: refs.control?.blur === before.blur, scrollTo: refs.control?.scrollTo === before.scrollTo };
      }), label).toEqual({
        root: true,
        editor: true,
        parent: true,
        control: true,
        focus: true,
        blur: true,
        scrollTo: true
      });
      previous = { actual, source };
      return actual;
    };
    try {
      await verify(original.initial, 'initial');
      for (const [index, step] of original.steps.entries()) {
        await capture.evaluate(
          (value, action) => value.setAction(action),
          { id: sample.id, index, action: step.action }
        );
        const action = step.action;
        if (['popup-omit', 'popup-restore', 'font', 'unrelated', 'font-query'].includes(action.type)) {
          await page.evaluate(action => document.querySelector('[data-surface-command]')!
            .dispatchEvent(new CustomEvent('omissionupdate', { detail: action })), action);
        }
        else if (action.type === 'click' || action.type === 'outside' || action.type === 'fill' || action.type === 'footer-fill') {
          await actSelectSurface(page, action);
        }
        else {
          throw Error(`Unhandled actual Original action ${JSON.stringify(action)}`);
        }
        await page.mouse.move(0, 0);
        await verify(step, `${index}/${JSON.stringify(action)}`);
      }
      const beforeDispose = await capture.evaluate(value => value.read());
      const disposalState = await retained.evaluate(value => ({ focused: document.activeElement === value.editor,
        rootConnected: Boolean(value.root?.isConnected), editorConnected: Boolean(value.editor?.isConnected) }));
      const focusedWidthUnmount = sample.id === 'select-surface-omission-width-open' && beforeDispose.open
        && disposalState.focused && disposalState.rootConnected && disposalState.editorConnected;
      await capture.evaluate(value => {
        value.setAction('unmount');
        value.dispose();
      });
      await expect(page.locator('[data-surface-case]')).toHaveCount(0);
      await drainSelectSurface(page);
      const cleanup = async () => ({ owner: await capture.evaluate(value => value.read()),
        refs: await capture.evaluate(value => value.readRefs()),
        dom: await page.evaluate(() => {
          const raw = (globalThis as unknown as { raw: { omissionObserver: { original: Record<string, HTMLElement> } } }).raw;
          return { originalConnected: Object.fromEntries(Object.entries(raw.omissionObserver.original).map(([name, node]) => [name, node.isConnected])),
            popupCount: document.querySelectorAll('.ant-select-dropdown').length,
            footerCount: document.querySelectorAll('[data-surface-footer-input]').length };
        }) });
      const disposed = await cleanup();
      trace.push({
        label: 'disposed',
        actual: disposed,
        beforeDispose: { owner: beforeDispose, ...disposalState }
      });
      expect(disposed.dom.originalConnected).toEqual(original.cleanup.originalConnected);
      expect(disposed.dom.popupCount).toBe(original.cleanup.popupCount);
      expect(disposed.dom.footerCount).toBe(original.cleanup.footerCount ?? 0);
      expect(disposed.owner.alive).toBe(false);
      expect(disposed.owner.events.slice(0, beforeDispose.events.length)).toEqual(beforeDispose.events);
      expect(disposed.owner.rawEvents.slice(0, beforeDispose.rawEvents.length)).toEqual(beforeDispose.rawEvents);
      // Connected disposal of the focused, open Native width owner preserves its
      // existing single close notification. The complete Source cleanup is kept.
      const extraEvents = disposed.owner.events.slice(beforeDispose.events.length);
      const extraRawEvents = disposed.owner.rawEvents.slice(beforeDispose.rawEvents.length);
      expect(extraEvents.map(decodeSelectSurface)).toEqual(focusedWidthUnmount ? [['open', false]] : []);
      expect(extraRawEvents.length).toBe(focusedWidthUnmount ? 1 : 0);
      if (focusedWidthUnmount) {
        verifySelectSurfaceEventGraph(extraRawEvents[0],
          createSelectSurfaceRecorder().raw(['open', false]), 'existing focused Native width unmount close');
      }
      expect(disposed.owner.calls).toEqual(beforeDispose.calls);
      // Добавляет отличие в журнале удаления к остальным результатам проверки.
      function recordDisposalComparison() {
        try {
          verifyOmissionLifecycle(
            disposed.owner.lifecycle,
            original.cleanup.lifecycle ?? [],
            'disposed'
          );
        }
        catch (error) { failures.push(String(error)); }
      }

      recordDisposalComparison();
      for (const [name, value] of Object.entries(disposed.refs)) expect(
        value == null,
        `${name} cleared`
      ).toBe(true);
      await page.waitForTimeout(1000);
      expect(await cleanup()).toEqual(disposed);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach(
        'actual-select-omission-raw',
        {
          body: JSON.stringify({ sample, trace, failures }, null, 2),
          contentType: 'application/json'
        }
      );
      await retained.dispose();
      await capture.dispose();
    }
  });
}
