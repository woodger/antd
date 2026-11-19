import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { ComponentProps } from 'svelte';
import type { SelectRef } from 'antd-svelte';
import { test, expect } from './test';
import { drainSelectSurface } from './select-surface-driver';
import { normalizedSelectSurfaceAuthoredProps, selectSurfaceEventValue, verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { autocompleteCloseReference, type AutocompleteCloseNode, type AutocompleteCloseNodes,
  type AutocompleteClosePoint, type AutocompleteCloseSlot } from './autocomplete-close-reference';
import type AutoCompleteCloseFixtures from './fixtures/AutoCompleteCloseFixtures.svelte';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

type Capture = Required<NonNullable<ComponentProps<typeof AutoCompleteCloseFixtures>['capture']>>;
type Refs = {
  control?: SelectRef;
  root?: HTMLDivElement;
  editor?: HTMLInputElement | HTMLTextAreaElement
};
interface Observer { ids: WeakMap<Node, number>; nextId: number; original: Partial<Record<AutocompleteCloseSlot, HTMLElement>> }
interface Raw { current: { readRefs: () => Refs; read: Capture['read'] }; contrastObserver?: Observer }
interface GraphNode { id: number; type: string; array: boolean; authoredRole: unknown;
  ownProperties: Array<Record<string, unknown>>; properties: Array<{
    key: unknown;
    value?: unknown;
    get?: unknown;
    set?: unknown
  }> }
interface Graph { root: unknown; objects: GraphNode[] }
const ref = (value: unknown) => value && typeof value === 'object' && 'ref' in value ? (value as { ref: number }).ref : undefined;
const property = (node: GraphNode, key: string) => node.properties.find(item => item.key === key)?.value;

// Full raw props retain descriptors, order and aliases. The sole public renderer
// is a React callback in Original and a compiled Svelte Snippet in Native.
function verifyPropsGraph(actualValue: unknown, sourceValue: unknown, label: string) {
  const a = actualValue as Graph, b = sourceValue as Graph;
  const native = new Map(a.objects.map(node => [node.id, node])), source = new Map(b.objects.map(node => [node.id, node]));
  const pairs = new Map<number, number>(), reverse = new Map<number, number>();
  function walk(left: unknown, right: unknown, root = false) {
    const ai = ref(left), bi = ref(right);
    if (ai === undefined || bi === undefined) {
      assert.deepEqual(left, right, label);
      return;
    }
    if (pairs.has(ai)) {
      assert.equal(pairs.get(ai), bi, label + ' raw alias');
      return;
    }
    assert(!reverse.has(bi), label + ' distinct raw alias');
    pairs.set(ai, bi);
    reverse.set(bi, ai);
    const x = native.get(ai)!, y = source.get(bi)!;
    assert(x && y, label + ' complete raw graph');
    assert.deepEqual(x.authoredRole, y.authoredRole);
    assert.equal(x.type, y.type);
    assert.equal(x.array, y.array);
    if (isDeepStrictEqual(y.authoredRole, { callback: 'close-contrast-option' })) {
      assert.equal(x.type, 'function');
      assert.equal(x.array, false);
      return;
    }
    const sourceFields = y.ownProperties.filter(item => !(root && item.key === 'ref'));
    const nativeFields = x.ownProperties.map(item => root && item.key === 'class' ? {
      ...item,
      key: 'className'
    } : item);
    assert.deepEqual(nativeFields, sourceFields, label + ' raw descriptors/order');
    const ys = y.properties.filter(item => !(root && item.key === 'ref'));
    const xs = x.properties.map(item => root && item.key === 'class' ? { ...item, key: 'className' } : item);
    assert.deepEqual(xs.map(item => item.key), ys.map(item => item.key), label + ' raw keys/order');
    for (const [index, item] of xs.entries()) {
      assert.equal(Object.hasOwn(item, 'value'), Object.hasOwn(ys[index], 'value'));
      if (Object.hasOwn(item, 'value')) walk(item.value, ys[index].value);
      else {
        walk(item.get, ys[index].get);
        walk(item.set, ys[index].set);
      }
    }
  }
  walk(a.root, b.root, true);
}
function verifyProducers(
  actual: readonly SelectSurfaceProducerCall[],
  source: readonly SelectSurfaceProducerCall[],
  label: string
) {
  const same = (a: SelectSurfaceProducerCall, b: SelectSurfaceProducerCall) => a.kind === b.kind && a.side === b.side
    && a.index === b.index && a.value === b.value && isDeepStrictEqual(a.argument, b.argument) && isDeepStrictEqual(
      a.result,
      b.result
    );
  for (const call of actual) {
    const original = source.find(item => same(call, item));
    assert(original, label + ' whole pure producer invocation belongs to Source prefix');
    assert.equal(call.kind, 'optionRender');
    assert.equal(call.side, 'own');
    verifySelectSurfaceEventGraph(
      call.rawArgument,
      original.rawArgument,
      label + ' raw producer args'
    );
    verifySelectSurfaceEventGraph(call.rawResult, original.rawResult, label + ' raw scalar result');
    const graph = call.rawArgument as Graph, nodes = new Map(graph.objects.map(node => [node.id, node]));
    const args = nodes.get(ref(graph.root)!)!, row = nodes.get(ref(property(args, '0'))!)!;
    const info = nodes.get(ref(property(args, '1'))!)!;
    assert.equal(call.index, property(info, 'index'));
    assert.equal(call.value, property(row, 'value'));
    assert.equal(
      call.rawOptionIdentity,
      ref(property(row, 'data')),
      label + ' actual raw option alias'
    );
  }
  // React may execute an identical pure pass more often; every distinct full
  // invocation is still required and both complete ledgers stay in the artifact.
  for (const call of source) {
    assert(
      actual.some(item => same(item, call)),
      label + ' every Source invocation occurred'
    );
  }
}

/** Same read-only observer as Original; it runs only after external barriers. */
function readActualPoint() {
  const raw = (window as unknown as { raw: Raw }).raw;
  const owner = raw.current.read();
  const refs = raw.current?.readRefs?.() ?? {};
  raw.contrastObserver ??= { ids: new WeakMap(), nextId: 0, original: {} };
  const observer = raw.contrastObserver;
  const identity = (node: Node | undefined) => {
    if (!node) {
      return null;
    }
    if (!observer.ids.has(node)) observer.ids.set(node, ++observer.nextId);
    return observer.ids.get(node)!;
  };
  const describe = (node: HTMLElement | undefined | null): AutocompleteCloseNode | null => {
    if (!node) {
      return null;
    }
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    return { identity: identity(node)!, connected: node.isConnected, tag: node.tagName, text: node.textContent,
      html: node.outerHTML, attributes: [...node.attributes].map(attribute => [attribute.name, attribute.value]), classes: [...node.classList],
      cssText: node.style.cssText, inlineProperties: [...node.style].map(name => ({
        name,
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name)
      })),
      css: Object.fromEntries((['display', 'visibility', 'opacity', 'position', 'width', 'height', 'minHeight', 'font', 'fontSize',
        'color', 'backgroundColor', 'overflow', 'overflowY', 'transform'] as const).map(key => [key, css[key]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      scrollTop: node.scrollTop, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight,
      value: 'value' in node ? (node as HTMLInputElement).value : null,
      caret: 'selectionStart' in node ? [(node as HTMLInputElement).selectionStart, (node as HTMLInputElement).selectionEnd] : null };
  };
  const popup = document.querySelector<HTMLElement>('.ant-select-dropdown'), list = popup?.querySelector<HTMLElement>('.ant-select-dropdown-list');
  const rows = [...popup?.querySelectorAll<HTMLElement>('.ant-select-item-option') ?? []];
  const current = {
    root: refs.root,
    editor: refs.editor,
    popup,
    list,
    holder: popup?.querySelector<HTMLElement>('.ant-select-dropdown-list-holder')
  };
  for (const [key, node] of Object.entries(current) as Array<[AutocompleteCloseSlot, HTMLElement | null | undefined]>) {
    if (node && !observer.original[key]) observer.original[key] = node;
  }
  const roleNodes = [...popup?.querySelectorAll<HTMLElement>('[role="listbox"],[role="option"],[role="presentation"]') ?? []];
  const nodes: AutocompleteCloseNodes = { current: Object.fromEntries(Object.entries(current).map(([key, node]) => [key, describe(node)])) as AutocompleteCloseNodes['current'],
    original: Object.fromEntries(Object.entries(observer.original).map(([key, node]) => [key, describe(node)])),
    sameAsOriginal: Object.fromEntries(Object.entries(current).map(([key, node]) => [key,
      observer.original[key as AutocompleteCloseSlot] ? node === observer.original[key as AutocompleteCloseSlot] : null])) as AutocompleteCloseNodes['sameAsOriginal'],
    visualRows: rows.map(node => ({ ...describe(node)!, active: node.classList.contains('ant-select-item-option-active'),
      selected: node.classList.contains('ant-select-item-option-selected') })),
    srRows: roleNodes.map(node => ({
      ...describe(node)!,
      insideVisualList: Boolean(list?.contains(node))
    })),
    activeVisualTitles: rows.filter(node => node.classList.contains('ant-select-item-option-active')).map(node => node.getAttribute('title')),
    ariaActiveDescendant: refs.editor?.getAttribute('aria-activedescendant') ?? null,
    popupText: popup?.textContent ?? null, popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    focus: {
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      isEditor: document.activeElement === refs.editor
    },
    publicRootMatches: (refs.control as (SelectRef & { nativeElement?: HTMLElement }) | undefined)?.nativeElement === refs.root,
    resources: performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      initiatorType: (entry as PerformanceResourceTiming).initiatorType
    })) };
  return { nodes, owner };
}
function roleRows(nodes: AutocompleteCloseNodes) {
  return nodes.srRows.map(node => {
    const attrs = Object.fromEntries(node.attributes);
    return { role: attrs.role, id: attrs.id, label: attrs['aria-label'], selected: attrs['aria-selected'], disabled: attrs['aria-disabled'],
      text: node.text, insideVisualList: node.insideVisualList };
  });
}
function verifyRoles(actual: AutocompleteCloseNodes, source: AutocompleteCloseNodes) {
  const current = roleRows(actual), expected = roleRows(source);
  assert.equal(current.length, expected.length);
  for (const [index, row] of current.entries()) {
    const original = expected[index];
    if (original.role === 'listbox' && original.id === 'close-contrast-field_list' && original.label === undefined) {
      // Existing Native listbox retains the caller label; every option label,
      // role, selected value, ordering and virtual neighbor stays strict.
      assert.equal(row.label, 'Close contrast value');
      assert.deepEqual({ ...row, label: undefined }, original);
    }
    else assert.deepEqual(row, original);
  }
}
function rowState(nodes: AutocompleteCloseNodes) {
  return nodes.visualRows.map(node => {
    const attrs = Object.fromEntries(node.attributes);
    return { title: attrs.title, text: node.text, active: node.active, selected: node.selected,
      role: attrs.role, ariaSelected: attrs['aria-selected'], ariaDisabled: attrs['aria-disabled'], backgroundColor: node.css.backgroundColor };
  });
}
const visible = (node: AutocompleteCloseNode | null) => Boolean(node && node.css.display !== 'none' && node.css.visibility !== 'hidden' && node.box.height > 0);

test.use({ viewport: { width: 1200, height: 900 } });
for (const source of autocompleteCloseReference.cases) test(`AutoComplete preserves Source close ordering for ${source.id}`, async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [], failures: string[] = [];
  const check = (label: string, fn: () => void) => {
    try {
    fn();
  }
  catch (error) {
    failures.push(label + ': ' + String(error));
  }
  };
  // sample comes from the URL so selecting the fixture does not steal initial focus.
  await page.goto('/?fixture=autocomplete-close&sample=' + encodeURIComponent(source.id));

  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-case', source.id);
  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
  const capture = await page.evaluateHandle(() => {
    const detail = {} as Capture;
    document.querySelector('[data-autocomplete-close-command]')!.dispatchEvent(new CustomEvent(
      'closecapture',
      { detail }
    ));
    if (!detail.read || !detail.readRefs || !detail.dispose) {
      throw Error('Public close fixture capture missing');
    }
    Object.assign(window, { raw: { current: { readRefs: detail.readRefs, read: detail.read } } });
    return detail;
  });
  const retained = await capture.evaluateHandle(owner => {
    const refs = owner.readRefs();
    return { ...refs, parent: refs.editor?.parentNode, focus: refs.control?.focus,
      blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
  });
  const barrier = async () => page.evaluate(async () => {
    for (let index = 0; index < 4; index++) {
      await new Promise<void>(resolve => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.close();
          channel.port2.close();
          resolve();
        };
        channel.port2.postMessage(null);
      });
    }
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  const read = () => page.evaluate(readActualPoint);
  let rowIdentities: Map<string, number> | undefined, resources: AutocompleteCloseNodes['resources'] | undefined;
  const verify = async (point: AutocompleteClosePoint) => {
    const actual = await read(), label = point.phase;
    trace.push({ phase: label, actual });
    check(label + '/owner-and-callbacks', () => {
      assert.equal(actual.owner.alive, true);
      for (const key of ['value', 'query', 'open'] as const) {
        assert.equal(
          actual.owner[key],
          point.owner[key]
        );
      }
      assert.deepEqual(
        normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
        normalizedSelectSurfaceAuthoredProps(point.owner.authoredProps)
      );
      verifyPropsGraph(
        actual.owner.rawAuthoredProps,
        point.owner.rawAuthoredProps,
        label + ' full props'
      );
      assert.deepEqual(actual.owner.authoredProvider, point.owner.authoredProvider);
      verifySelectSurfaceEventGraph(
        actual.owner.rawAuthoredProvider,
        point.owner.rawAuthoredProvider,
        label + ' full provider'
      );
      assert.deepEqual(
        actual.owner.events.map(selectSurfaceEventValue),
        source.events.slice(0, point.owner.eventCount).map(selectSurfaceEventValue)
      );
      assert.equal(actual.owner.rawEvents.length, point.owner.rawEventCount);
      for (const [index, event] of actual.owner.rawEvents.entries()) {
        verifySelectSurfaceEventGraph(
          event,
          source.rawEvents[index],
          label + '/event' + index
        );
      }
    });
    check(
      label + '/pure-producer-args-results',
      () => verifyProducers(
        actual.owner.calls,
        source.producerCalls.slice(0, point.owner.producerCount),
        label
      )
    );
    check(label + '/editor-active-sr-collection', () => {
      assert.equal(actual.nodes.current.editor?.tag, 'INPUT');
      assert.equal(actual.nodes.current.editor?.value, point.nodes.current.editor?.value);
      assert.deepEqual(actual.nodes.current.editor?.caret, point.nodes.current.editor?.caret);
      assert.equal(actual.nodes.current.editor?.attributes.find(([key]) => key === 'aria-expanded')?.[1],
        point.nodes.current.editor?.attributes.find(([key]) => key === 'aria-expanded')?.[1]);
      assert.deepEqual(actual.nodes.focus, point.nodes.focus);
      assert.equal(actual.nodes.popupCount, point.nodes.popupCount);
      assert.equal(visible(actual.nodes.current.popup), visible(point.nodes.current.popup));
      assert.equal(actual.nodes.current.holder?.scrollTop, point.nodes.current.holder?.scrollTop);
      assert.deepEqual(actual.nodes.activeVisualTitles, point.nodes.activeVisualTitles);
      assert.deepEqual(rowState(actual.nodes), rowState(point.nodes));
      verifyRoles(actual.nodes, point.nodes);
      assert.equal(actual.nodes.popupText, point.nodes.popupText);
      // Retained Native input omits the sentinel -1 id; real active ids stay exact.
      if (point.owner.open && point.nodes.ariaActiveDescendant === 'close-contrast-field_list_-1') {
        assert.equal(
          actual.nodes.ariaActiveDescendant,
          null
        );
      }
      else assert.equal(actual.nodes.ariaActiveDescendant, point.nodes.ariaActiveDescendant);
      for (const key of Object.keys(point.nodes.current) as AutocompleteCloseSlot[]) {
        assert.equal(Boolean(actual.nodes.current[key]), Boolean(point.nodes.current[key]));
        assert.equal(
          actual.nodes.current[key]?.connected ?? null,
          point.nodes.current[key]?.connected ?? null
        );
      }
      assert.deepEqual(actual.nodes.sameAsOriginal, point.nodes.sameAsOriginal);
      assert.equal(actual.nodes.publicRootMatches, false);
      assert.equal(point.nodes.publicRootMatches, true);
      if (actual.nodes.visualRows.length && !rowIdentities) rowIdentities = new Map(actual.nodes.visualRows.map(node => [node.attributes.find(([key]) => key === 'title')![1], node.identity]));
      for (const node of actual.nodes.visualRows) {
        assert.equal(
          node.identity,
          rowIdentities?.get(node.attributes.find(([key]) => key === 'title')![1]),
          'Retain every actual row node'
        );
      }
      resources ??= actual.nodes.resources;
      assert.deepEqual(actual.nodes.resources, resources);
    });
    const identities = await retained.evaluate(old => {
      const refs = (window as unknown as { raw: Raw }).raw.current.readRefs();
      return { root: old.root === refs.root, editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo };
    });
    check(label + '/retained-public-refs', () => assert(Object.values(identities).every(Boolean)));
  };
  const editor = page.getByRole('combobox', { name: 'Close contrast value', exact: true });
  const beta = page.locator('.ant-select-item-option-content').filter({ hasText: /^Beta$/ });
  try {
    await page.mouse.move(0, 0);
    await barrier();
    await verify(source.initial);
    await editor.click();
    await page.mouse.move(0, 0);
    await barrier();
    await verify(source.opened);
    await editor.fill('needle');
    await page.mouse.move(0, 0);
    await barrier();
    await verify(source.typed);
    if (source.sample.method === 'direct-pointer') await beta.scrollIntoViewIfNeeded();
    else if (source.sample.method === 'settled-hover-pointer') await beta.hover();
    else {
      await editor.press('ArrowDown');
      await editor.press('ArrowDown');
    }
    await drainSelectSurface(page);
    await verify(source.prepared);
    if (source.sample.method === 'enter') await editor.press('Enter'); else await beta.click();
    await page.mouse.move(0, 0);
    // No read, flush or retry between the trusted gesture and this fixed barrier.
    await barrier();
    await verify(source.closed);
    expect(await capture.evaluate(owner => owner.flags())).toEqual(source.flags);
    await page.locator('[data-surface-outside]').click();
    await barrier();
    await verify(source.outside);
    const before = await capture.evaluate(owner => owner.read());
    await capture.evaluate(owner => owner.dispose());
    await barrier();
    const cleanup = async () => ({ ...await read(), refsCleared: await capture.evaluate(owner => Object.values(owner.readRefs()).every(value => value == null)),
      retained: await retained.evaluate(refs => ({
        rootConnected: refs.root?.isConnected,
        editorConnected: refs.editor?.isConnected
      })),
      flags: await capture.evaluate(owner => owner.flags()) });
    const disposed = await cleanup();
    trace.push({ phase: 'disposed', actual: disposed });
    expect(disposed.refsCleared).toBe(true);
    expect(disposed.retained).toEqual({ rootConnected: false, editorConnected: false });
    expect(disposed.nodes.popupCount).toBe(source.cleanup.nodes.popupCount);
    expect(disposed.owner.alive).toBe(false);
    expect(disposed.owner.events).toEqual(before.events);
    expect(disposed.owner.rawEvents).toEqual(before.rawEvents);
    expect(disposed.owner.calls).toEqual(before.calls);
    expect(disposed.flags).toEqual(source.cleanup.flags);
    await page.waitForTimeout(1000);
    const late = await cleanup();
    trace.push({ phase: 'disposed-after-1000ms', actual: late });
    expect(late).toEqual(disposed);
    expect(failures).toEqual([]);
  } finally {
    await testInfo.attach('actual-autocomplete-close-raw', { body: JSON.stringify({ id: source.id, sample: source.sample,
      sourceDecodedSha256: 'a4543842faf98637bf2f2cb1b386f2fcd43b9b63209e3a2634c2fbf5b879ae5c', trace, failures }, null, 2), contentType: 'application/json' });
    await retained.dispose();
    await capture.dispose();
  }
});
