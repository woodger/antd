import { test, expect } from './test';
import { inputWidthOwnSamples } from './select-surface-input-width-own-cases.mjs';
import { omissionGeometry } from './select-surface-omission-cases.mjs';
import { selectSurfaceInputWidthOwnReference } from './select-surface-input-width-own-reference';
import { prepareSelectSurface, actSelectSurface, drainSelectSurface } from './select-surface-driver';
import { decodeSelectSurface } from './select-surface-receipts';
import { createSelectSurfaceRecorder } from './select-surface-producers.mjs';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { settleNativeInputWidthOwn, verifyNativeInputWidthOwn, type NativeInputWidthOwnOwner } from './select-surface-input-width-own-native-assertions';

test.use({ viewport: omissionGeometry.viewport });
for (const original of selectSurfaceInputWidthOwnReference.cases) {
  test(`Select preserves actual authored input width history for ${original.id}`, async (
    { page },
    testInfo
  ) => {
    const sample = inputWidthOwnSamples.find(sample => sample.id === original.id)!;
    const trace: unknown[] = [], failures: string[] = [];
    await page.goto('/?fixture=select-surface-omission');
    await page.getByRole('combobox', { name: 'Select surface omission sample', exact: true }).selectOption(sample.id);

    await expect(page.locator('[data-surface-case]')).toHaveAttribute(
      'data-surface-case',
      sample.id
    );
    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
    await prepareSelectSurface(page);
    const capture = await page.evaluateHandle(() => {
      const detail: {
        read?: () => NativeInputWidthOwnOwner;
        readRefs?: () => Record<string, unknown>;
        dispose?: () => void
      } = {};
      document.querySelector('[data-surface-fixture-command]')!.dispatchEvent(new CustomEvent(
        'surfacecapture',
        { detail }
      ));
      if (!detail.read || !detail.readRefs || !detail.dispose) {
        throw Error('Actual width ownership capture missing');
      }
      Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
      return { read: detail.read, readRefs: detail.readRefs, dispose: detail.dispose };
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
    let initialResources: Awaited<ReturnType<typeof settleNativeInputWidthOwn>>['width']['resourceEntries'] | undefined;
    const verify = async (source: typeof original.initial, label: string) => {
      const actual = await settleNativeInputWidthOwn(page);
      trace.push({ label, actual });
      failures.push(...verifyNativeInputWidthOwn(actual, source, original, label));
      initialResources ??= actual.width.resourceEntries;
      // Runtime module URLs differ between frameworks. Keep both complete raw
      // ledgers and require no resources from any width/query action.
      expect(actual.width.resourceEntries).toEqual(initialResources);
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
    };
    try {
      await verify(original.initial, 'initial');
      for (const [index, step] of original.steps.entries()) {
        if (step.action.type === 'width-own') {
          await page.evaluate(action => document.querySelector('[data-surface-command]')!
            .dispatchEvent(new CustomEvent('inputwidthownupdate', { detail: action })), step.action);
        }
        else {
          await actSelectSurface(page, step.action);
        }
        await page.mouse.move(0, 0);
        await verify(step, `${index}/${JSON.stringify(step.action)}`);
      }
      const beforeDispose = await capture.evaluate(value => value.read());
      const disposalState = await retained.evaluate(value => ({ focused: document.activeElement === value.editor,
        rootConnected: Boolean(value.root?.isConnected), editorConnected: Boolean(value.editor?.isConnected) }));
      const focusedWidthUnmount = inputWidthOwnSamples.some(sample => sample.id === original.id) && beforeDispose.open
        && disposalState.focused && disposalState.rootConnected && disposalState.editorConnected;
      await capture.evaluate(value => value.dispose());
      await expect(page.locator('[data-surface-case]')).toHaveCount(0);
      await drainSelectSurface(page);
      const cleanup = async () => ({ owner: await capture.evaluate(value => value.read()), refs: await capture.evaluate(value => value.readRefs()),
        dom: await page.evaluate(() => {
          const raw = (globalThis as unknown as { raw: { omissionObserver: { original: Record<string, HTMLElement> } } }).raw;
          return { originalConnected: Object.fromEntries(Object.entries(raw.omissionObserver.original).map(([name, node]) => [name, node.isConnected])),
            popupCount: document.querySelectorAll('.ant-select-dropdown').length,
            resourceEntries: performance.getEntriesByType('resource').map(entry => ({
              name: entry.name,
              initiatorType: (entry as PerformanceResourceTiming).initiatorType
            })) };
        }) });
      const disposed = await cleanup();
      trace.push({
        label: 'disposed',
        actual: disposed,
        beforeDispose: { owner: beforeDispose, ...disposalState }
      });
      expect(disposed.dom.originalConnected).toEqual(original.cleanup.originalConnected);
      expect(disposed.dom.popupCount).toBe(original.cleanup.popupCount);
      expect(disposed.dom.resourceEntries).toEqual(initialResources);
      expect(disposed.owner.alive).toBe(false);
      expect(disposed.owner.events.slice(0, beforeDispose.events.length)).toEqual(beforeDispose.events);
      expect(disposed.owner.rawEvents.slice(0, beforeDispose.rawEvents.length)).toEqual(beforeDispose.rawEvents);
      const extraEvents = disposed.owner.events.slice(beforeDispose.events.length);
      const extraRawEvents = disposed.owner.rawEvents.slice(beforeDispose.rawEvents.length);
      expect(extraEvents.map(decodeSelectSurface)).toEqual(focusedWidthUnmount ? [['open', false]] : []);
      expect(extraRawEvents.length).toBe(focusedWidthUnmount ? 1 : 0);
      if (focusedWidthUnmount) {
        verifySelectSurfaceEventGraph(extraRawEvents[0],
          createSelectSurfaceRecorder().raw(['open', false]), 'existing connected Native width input unmount close');
      }
      expect(disposed.owner.calls).toEqual(beforeDispose.calls);
      for (const [name, value] of Object.entries(disposed.refs)) expect(
        value == null,
        `${name} binding cleared`
      ).toBe(true);
      await page.waitForTimeout(1000);
      expect(await cleanup()).toEqual(disposed);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach(
        'actual-select-input-width-own-raw',
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

test('Select semantic input keeps the Source minimum without an explicit theme', async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [];
  await page.goto('/?fixture=select-surface-omission');
  await page.getByRole('combobox', { name: 'Select surface omission sample', exact: true })
    .selectOption('select-surface-input-width-own-native-minimum');

  await expect(page.locator('[data-surface-case]')).toHaveAttribute(
    'data-surface-case',
    'select-surface-input-width-own-native-minimum'
  );
  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
  await prepareSelectSurface(page);
  const capture = await page.evaluateHandle(() => {
    const detail: {
      read?: () => NativeInputWidthOwnOwner;
      readRefs?: () => Record<string, unknown>;
      dispose?: () => void
    } = {};
    document.querySelector('[data-surface-fixture-command]')!.dispatchEvent(new CustomEvent(
      'surfacecapture',
      { detail }
    ));
    if (!detail.read || !detail.readRefs || !detail.dispose) {
      throw Error('Actual minimum width capture missing');
    }
    Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
    return { read: detail.read, readRefs: detail.readRefs, dispose: detail.dispose };
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
  const verify = async (label: string, query: string, measured: boolean) => {
    const point = await settleNativeInputWidthOwn(page);
    trace.push({ label, actual: point });
    expect(Object.hasOwn(decodeSelectSurface(point.owner.authoredProvider) as object, 'theme')).toBe(false);
    expect(point.width.value).toBe(query);
    expect(point.width.computedMinWidth).toBe('4px');
    expect(await retained.evaluate(before => {
      const refs: { root?: HTMLElement; editor?: HTMLElement; control?: Record<string, unknown> } = {};
      document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
        'surfacerefs',
        { detail: refs }
      ));
      return { root: refs.root === before.root, editor: refs.editor === before.editor, parent: refs.editor?.parentNode === before.parent,
        control: refs.control === before.control, focus: refs.control?.focus === before.focus,
        blur: refs.control?.blur === before.blur, scrollTo: refs.control?.scrollTo === before.scrollTo };
    })).toEqual({
      root: true,
      editor: true,
      parent: true,
      control: true,
      focus: true,
      blur: true,
      scrollTo: true
    });
    if (measured) {
      // Pinned rc-select Input.js reads this actual field's scrollWidth at width0,
      // then clears width. This Native-only scratch restores the full declaration
      // and never changes logical styles.input or the immutable Source observers.
      const scratch = await retained.evaluate(value => {
        const input = value.editor!, style = input.style;
        const present = [...style].includes('width'), width = style.getPropertyValue('width'), priority = style.getPropertyPriority('width');
        const snapshot = () => ({ cssText: style.cssText, properties: [...style].map(name => ({ name,
          value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) })) });
        const before = snapshot();
        style.setProperty('width', '0px');
        const scrollWidth = input.scrollWidth;
        if (present) {
          style.setProperty('width', width, priority);
        }
        else {
          style.removeProperty('width');
        }
        return { before, after: snapshot(), scrollWidth };
      });
      trace.push({ label: `${label}/physical-width0`, actual: scratch });
      expect(scratch.after).toEqual(scratch.before);
      expect(await capture.evaluate(value => value.read())).toEqual(point.owner);
      expect(point.width.inlineVariable).toBe(String(scratch.scrollWidth));
      expect(point.width.inlineWidth).toBe('');
      expect(point.width.box.width).toBe(Math.max(4, scratch.scrollWidth));
      if (query === '') expect(point.width.box.width).toBe(4);
    }
    else {
      expect(point.width.inlineWidth).toBe('20px');
      expect(point.width.box.width).toBe(20);
    }
    return point;
  };
  try {
    await verify('empty', '', true);
    await page.locator('[data-surface-case] input[role="combobox"]').fill('i');
    await verify('short-query', 'i', true);
    await page.evaluate(() => document.querySelector('[data-surface-command]')!
      .dispatchEvent(new CustomEvent(
        'inputwidthownupdate',
        { detail: { type: 'width-own', kind: 'numeric20' } }
      )));
    await verify('authored-width-same-query', 'i', false);
    await page.locator('[data-surface-case] input[role="combobox"]').fill('ii');
    const final = await verify('query-clears-physical-width', 'ii', true);
    expect({
      kind: final.owner.widthKind,
      ownKey: final.owner.widthOwnKey,
      value: final.owner.widthValue
    })
      .toEqual({ kind: 'numeric20', ownKey: true, value: 20 });
    expect(decodeSelectSurface(final.owner.inputStyle)).toEqual({ fontSize: 12, width: 20 });
    await capture.evaluate(value => value.dispose());
    await expect(page.locator('[data-surface-case]')).toHaveCount(0);
    expect(await retained.evaluate(value => ({ root: value.root?.isConnected, editor: value.editor?.isConnected,
      popupCount: document.querySelectorAll('.ant-select-dropdown').length }))).toEqual({
        root: false,
        editor: false,
        popupCount: 0
      });
    expect(Object.values(await capture.evaluate(value => value.readRefs())).every(value => value == null)).toBe(true);
  } finally {
    await testInfo.attach(
      'actual-select-input-width-minimum-raw',
      { body: JSON.stringify({ trace }, null, 2), contentType: 'application/json' }
    );
    await retained.dispose();
    await capture.dispose();
  }
});
