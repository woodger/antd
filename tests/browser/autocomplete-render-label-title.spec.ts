import assert from 'node:assert/strict';
import { test, expect } from './test';
import { readSelectSurface } from './select-surface-metrics';
import { readAutocompleteLabelTitle } from './autocomplete-render-label-title-metrics.mjs';
import { drainSelectSurface, prepareSelectSurface } from './select-surface-driver';
import { normalizedSelectSurfaceAuthoredProps, selectSurfaceEventValue, verifySelectSurfaceEventGraph,
  verifySelectSurfaceNode, readNativeSurfaceTopology } from './select-surface-assertions';
import { verifyAutocompleteCalls, verifyAutocompleteGraph } from './autocomplete-render-assertions';
import { autocompleteLabelTitleReference } from './autocomplete-render-label-title-reference';
import type { ComponentProps } from 'svelte';
import type AutoCompleteRenderLabelTitleCase from './fixtures/AutoCompleteRenderLabelTitleCase.svelte';
type Capture = Required<NonNullable<ComponentProps<typeof AutoCompleteRenderLabelTitleCase>['capture']>>;
test.use({ viewport: { width: 1200, height: 900 } });
for (const original of autocompleteLabelTitleReference.cases) test(`AutoComplete keeps raw title priority and scalar labels for ${original.id}`, async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [], failures: string[] = [];
  await page.goto('/?fixture=autocomplete-render-label-title');
  await page.getByRole('combobox', { name: 'AutoComplete label title sample', exact: true }).selectOption(original.id);

  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
  await prepareSelectSurface(page);
  const capture = await page.evaluateHandle(() => {
    const detail = {} as Capture & { dispose: () => void };
    document.querySelector('[data-label-title-fixture-command]')!.dispatchEvent(new CustomEvent(
      'labeltitlecapture',
      { detail }
    ));
    Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
    return detail;
  });
  const retained = await capture.evaluateHandle(value => ({ ...value.readRefs(), focus: value.readRefs().control?.focus,
    blur: value.readRefs().control?.blur, scrollTo: value.readRefs().control?.scrollTo }));
  const read = async () => ({ dom: await page.evaluate(readSelectSurface), nodes: await page.evaluate(readAutocompleteLabelTitle),
    topology: await page.evaluate(readNativeSurfaceTopology), owner: await capture.evaluate(value => value.read()) });
  const verify = async (point: typeof original.initial, label: string) => {
    let prior = '', stable = 0;
    let actual: Awaited<ReturnType<typeof read>> | undefined;
    for (let i = 0; i < 90; i++) {
      await drainSelectSurface(page);
      actual = await read();
      const key = JSON.stringify(actual);
      stable = key === prior ? stable + 1 : 0;
      if (stable >= 3) break;
      prior = key;
    }
    if (stable < 3 || !actual) throw Error('Actual Native label/title view did not settle');
    const current = actual;
    trace.push({ label, actual: current });
    const check = (name: string, fn: () => void) => {
      try {
      fn();
    }
    catch (e) {
      failures.push(label + '/' + name + ': ' + String(e));
    }
    };
    check('whole-public-owner', () => {
      for (const key of ['renderer', 'open', 'model', 'optionTitleOwnKey', 'optionOwnKeys'] as const) assert.deepEqual(
        current.owner[key],
        point.owner[key]
      );
      assert.deepEqual(
        normalizedSelectSurfaceAuthoredProps(current.owner.authoredProps),
        normalizedSelectSurfaceAuthoredProps(point.owner.authoredProps)
      );
      assert.deepEqual(current.owner.authoredProvider, point.owner.authoredProvider);
      verifyAutocompleteGraph(
        current.owner.rawAuthoredProps,
        point.owner.rawAuthoredProps,
        label + ' raw props',
        true
      );
      verifySelectSurfaceEventGraph(
        current.owner.rawAuthoredProvider,
        point.owner.rawAuthoredProvider,
        label + ' raw provider'
      );
      verifyAutocompleteCalls(
        current.owner.calls,
        original.producerCalls.slice(0, point.owner.producerCount),
        label
      );
      assert.deepEqual(
        current.owner.events.map(selectSurfaceEventValue),
        original.events.slice(0, point.owner.eventCount).map(selectSurfaceEventValue)
      );
      for (const [i, event] of current.owner.rawEvents.entries()) verifySelectSurfaceEventGraph(
        event,
        original.rawEvents[i],
        label + '/event' + i
      );
    });
    check('actual-css-geometry-editor', () => {
      for (const [slot, nodes] of Object.entries(point.dom.view.slots)) {
        assert.equal(current.dom.view.slots[slot].length, nodes.length, slot + ' count');
        for (const [i, node] of nodes.entries()) verifySelectSurfaceNode(current.dom.view.slots[slot][i], node, slot, { control: 'autocomplete' },
          ['surface-control'], label, point.dom.raw.slots[slot][i].attributes.find(([k]) => k === 'style')?.[1] ?? '',
          {
            callerLabel: 'Label title value',
            inputLayout: current.topology.editorLayout,
            raw: current.dom.raw.slots[slot][i]
          });
      }
      assert.deepEqual(current.dom.view.editor, point.dom.view.editor);
      assert.equal(current.dom.view.focus, point.dom.view.focus);
      assert.deepEqual(current.dom.view.leaks, []);
      assert.deepEqual(current.nodes.sameAsOriginal, point.nodes.sameAsOriginal);
      assert.equal(current.nodes.current.content?.title, point.nodes.current.content?.title);
      assert.equal(current.nodes.current.content?.text, point.nodes.current.content?.text);
      const children = (p: typeof current.nodes) => p.contentChildren.filter(n => n.nodeType !== 8 && !(n.nodeType === 3 && n.text === ''))
        .map(n => ({ type: n.nodeType, name: n.nodeName, text: n.text, editor: n.isEditor }));
      assert.deepEqual(children(current.nodes), children(point.nodes));
      assert.equal(current.nodes.publicRefs.rootMatches, false);
      assert.equal(point.nodes.publicRefs.rootMatches, true);
      assert.equal(current.nodes.publicRefs.childIsEditor, point.nodes.publicRefs.childIsEditor);
    });
    expect(await retained.evaluate(old => {
      const now: {
        root?: HTMLElement;
        editor?: HTMLElement;
        control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown }
      } = {};
      document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
        'surfacerefs',
        { detail: now }
      ));
      return { root: old.root === now.root, editor: old.editor === now.editor, control: old.control === now.control,
        focus: old.focus === now.control?.focus, blur: old.blur === now.control?.blur, scrollTo: old.scrollTo === now.control?.scrollTo };
    })).toEqual({ root: true, editor: true, control: true, focus: true, blur: true, scrollTo: true });
  };
  try {
    await verify(original.initial, 'initial');
    for (const [i, step] of original.steps.entries()) {
      if (step.action.type === 'renderer') await capture.evaluate(
        (value, action) => value.update(action),
        step.action
      );
      else if (step.action.type === 'click') await page.getByRole(
        'combobox',
        { name: 'Label title value', exact: true }
      ).click();
      else await page.locator('[data-surface-outside]').click();
      await verify(step, i + '/' + JSON.stringify(step.action));
    }
    const before = await capture.evaluate(value => value.read());
    await capture.evaluate(value => value.dispose());
    await expect(page.locator('[data-surface-case]')).toHaveCount(0);
    await drainSelectSurface(page);
    const cleanup = async () => ({ state: await capture.evaluate(value => value.read()), refs: await capture.evaluate(value => value.readRefs()),
      connected: await retained.evaluate(value => [value.root?.isConnected, value.editor?.isConnected]), popup: await page.locator('.ant-select-dropdown').count() });
    const disposed = await cleanup();
    trace.push({ label: 'disposed', actual: disposed });
    expect(disposed.connected).toEqual([false, false]);
    expect(disposed.popup).toBe(0);
    expect(Object.values(disposed.refs).every(v => v == null)).toBe(true);
    expect(disposed.state.events).toEqual(before.events);
    expect(disposed.state.rawEvents).toEqual(before.rawEvents);
    expect(disposed.state.calls).toEqual(before.calls);
    await page.waitForTimeout(1000);
    expect(await cleanup()).toEqual(disposed);
    expect(failures).toEqual([]);
  } finally {
    await testInfo.attach(
      'actual-autocomplete-render-label-title-raw',
      { body: JSON.stringify({ trace, failures }, null, 2), contentType: 'application/json' }
    );
    await retained.dispose();
    await capture.dispose();
  }
});
