import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { Page } from '@playwright/test';
import { readSelectComponentsHydration, type ComponentsHydrationNode, type ComponentsHydrationPoint } from './select-components-hydration-metrics.mjs';
import type { ComponentsHydrationSourceCase } from './select-components-hydration-reference';
import type { SelectComponentsHydrationAction } from './fixtures/select-components-hydration-cases.mjs';

export const selectComponentsHydrationSSRMarker = 'data-ant-native-select-component-ssr';
export const selectComponentsConnectedRemovalBlur = ['blur', { type: 'focusout', key: { $: 'undefined' },
  defaultPrevented: false, propagationStopped: false, target: 'TEXTAREA', currentTarget: 'DIV' }];

export async function settleSelectComponentsHydration(page: Page): Promise<ComponentsHydrationPoint> {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 80; attempt++) {
    await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise(resolve => setTimeout(resolve));
      await new Promise(resolve => setTimeout(resolve));
    });
    const point = await page.evaluate(readSelectComponentsHydration), key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = key;
  }
  throw Error('Native components hydration did not settle');
}
function focusEvent(value: unknown) {
  if (!Array.isArray(value) || !['focus', 'blur'].includes(String(value[0]))
    || !value[1] || typeof value[1] !== 'object') {
    return value;
  }
  const event = value[1] as Record<string, unknown>;
  if (event.type !== 'focus' && event.type !== 'blur') {
    return value;
  }
  return [value[0], { ...event, type: event.type === 'focus' ? 'focusin' : 'focusout' }, ...value.slice(2)];
}
function markerAttributes(node: ComponentsHydrationNode, allowed: boolean) {
  const marker = node.attributes.filter(([name]) => name === selectComponentsHydrationSSRMarker);
  assert.deepEqual(
    marker,
    allowed ? [[selectComponentsHydrationSSRMarker, '']] : [],
    'exact private SSR marker'
  );
  return allowed ? node.attributes.filter(([name]) => name !== selectComponentsHydrationSSRMarker) : node.attributes;
}
function editor(
  actual: ComponentsHydrationNode | null,
  source: ComponentsHydrationNode | null,
  timingBoundary: boolean,
  ssrMarker = false
) {
  assert.equal(Boolean(actual), Boolean(source), 'physical editor presence');
  if (!actual || !source) {
    return;
  }
  assert.deepEqual(
    markerAttributes(actual, ssrMarker),
    source.attributes,
    'complete intrinsic attributes'
  );
  for (const field of ['identity', 'connected', 'tag', 'defaultValue', 'textContent', 'focused'] as const)
    assert.deepEqual(actual[field], source[field], field);
  if (!timingBoundary) {
    assert.equal(actual.value, source.value, 'value');
    assert.deepEqual(actual.selection, source.selection, 'selection');
  }
}
function sourceCallbackEvent(value: unknown) {
  const event = focusEvent(value);
  if (!Array.isArray(event) || event[0] !== 'change' || event.length !== 3
    || !isDeepStrictEqual(event[2], { props: { $: 'accessor' } })) {
    return event;
  }
  // Pinned Source injects only its deprecated non-data props getter for a free
  // typed value without a raw option. Preserve value, event order and all raw rows.
  return [event[0], event[1], {}];
}
function pendingSourceRemoval(
  entry: ComponentsHydrationSourceCase,
  point: ComponentsHydrationPoint
) {
  if (entry.id !== 'select-components-hydration-ac-replace-close' || point.owner?.alive !== false) {
    return undefined;
  }
  const pending = entry.steps.at(-1)!;
  assert.equal(pending.action.type, 'close-dispose');
  assert(pending.immediate?.owner && pending.settled.owner);
  assert.deepEqual(
    pending.settled.owner.events,
    [...pending.immediate.owner.events, ['open', false]]
  );
  assert(
    pending.immediate.owner.events.every(event => !Array.isArray(event) || event[0] !== 'blur'),
    'Source has no removal blur'
  );
  assert(
    pending.settled.owner.events.every(event => !Array.isArray(event) || event[0] !== 'blur'),
    'Source late ledger has no blur'
  );
  assert.equal(point.refs.control, false);
  assert.deepEqual(point.owner.events, pending.immediate.owner.events.length === point.owner.events.length
    ? pending.immediate.owner.events : pending.settled.owner.events);
  return pending.immediate.owner;
}
/** All raw snapshots remain in the trace. Only captured framework timing and
 * the existing removed-control quiescence contract use the named boundaries. */
export function verifySelectComponentsHydrationPoint(
  actual: ComponentsHydrationPoint,
  source: ComponentsHydrationPoint,
  entry: ComponentsHydrationSourceCase,
  phase: 'parsed' | 'dirty' | 'commit' | 'settled' | 'removed' | 'cleanup',
  label: string
) {
  const failures: string[] = [];
  const check = (name: string, fn: () => void) => {
    try {
    fn();
  }
  catch (error) {
    failures.push(label + '/' + name + ': ' + String(error));
  }
  };
  const commitTiming = phase === 'commit' && entry.sample.control === 'select'
    && (!isDeepStrictEqual(entry.commit.editor?.value, entry.initial.editor?.value)
      || !isDeepStrictEqual(entry.commit.editor?.selection, entry.initial.editor?.selection));
  const parsedSSR = phase === 'parsed' || phase === 'dirty';
  check(
    'editor',
    () => editor(
      actual.editor,
      source.editor,
      commitTiming,
      parsedSSR && source.root?.tag === 'INPUT'
    )
  );
  check('identity', () => assert.deepEqual(actual.identity, source.identity));
  check('public-refs', () => assert.deepEqual(actual.refs, source.refs));
  check('root', () => {
    assert.equal(Boolean(actual.root), Boolean(source.root));
    if (!actual.root || !source.root) {
      return;
    }
    assert.equal(actual.root.identity, source.root.identity);
    assert.equal(actual.root.tag, source.root.tag);
    assert.equal(actual.root.connected, source.root.connected);
    markerAttributes(actual.root, parsedSSR);
    // The standard Native Select container retains its documented presentation
    // boundary. New root replacements have the complete Source intrinsic attrs.
    if (source.root.tag === 'INPUT') editor(actual.root, source.root, false, parsedSSR);
    if (phase !== 'parsed' && phase !== 'dirty' && phase !== 'commit') {
      assert.deepEqual(
        actual.root.box,
        source.root.box
      );
    }
  });
  check('owner', () => {
    assert.equal(Boolean(actual.owner), Boolean(source.owner));
    if (!actual.owner || !source.owner) {
      return;
    }
    const removed = pendingSourceRemoval(entry, source);
    for (const field of ['model', 'slot', 'alive', 'revision'] as const) {
      assert.deepEqual(
        actual.owner[field],
        source.owner[field],
        field
      );
    }
    assert.equal(actual.owner.open, removed?.open ?? source.owner.open);
    const events = (removed?.events ?? source.owner.events).map(sourceCallbackEvent);
    assert.deepEqual(
      actual.owner.events,
      removed ? [...events, selectComponentsConnectedRemovalBlur] : events
    );
    assert.deepEqual(actual.owner.methods, source.owner.methods);
    // React composeRef may detach/attach a stable DOM on each render; Svelte
    // tracks attachments. Check every authored lifecycle kind and keep both ledgers.
    const activeKind = source.owner.slot === 'root-element' ? 'root' : source.owner.slot === 'input-element' ? 'input'
      : source.owner.slot === 'input-composite' ? 'composite' : undefined;
    for (const event of new Set(source.owner.lifecycle.map(row => row.event))) {
      if (event.endsWith('-detach') && phase !== 'cleanup' && event === `${activeKind}-detach`) continue;
      assert(actual.owner.lifecycle.some(row => row.event === event), 'authored lifecycle ' + event);
    }
  });
  if (phase !== 'parsed' && phase !== 'dirty') {
    check(
      'popup-count',
      () => assert.equal(actual.popupCount, source.popupCount)
    );
  }
  if (phase === 'cleanup') {
    check('retained-root', () => {
      assert.equal(actual.parsedRoot?.identity, source.parsedRoot?.identity);
      assert.equal(actual.parsedRoot?.tag, source.parsedRoot?.tag);
      assert.equal(actual.parsedRoot?.connected, source.parsedRoot?.connected);
    });
    check('retained-editor', () => editor(actual.parsedEditor, source.parsedEditor, false));
  }
  return { failures, boundaries: [
    ...(parsedSSR ? ['private-SSR-component-marker-on-owner-only'] : []),
    ...(commitTiming ? ['react-layout-commit-vs-svelte-onMount/value-selection'] : []),
    ...(source.owner?.events.some(event => !isDeepStrictEqual(
      sourceCallbackEvent(event),
      focusEvent(event)
    ))
      ? ['source-empty-option-deprecated-props-accessor'] : []),
    ...(pendingSourceRemoval(entry, source) ? ['removed-control-pending-close', 'native-connected-input-removal-blur'] : [])
  ] };
}
export async function actSelectComponentsHydration(
  page: Page,
  action: SelectComponentsHydrationAction
) {
  if (action.type === 'focus' || action.type === 'blur') {
    await page.evaluate(type => {
      const control = window.componentsHydrationProbe.api!.readRefs().control;
      if (!control) {
        throw Error('Missing real hydrated public control');
      }
      if (type === 'focus') {
        control.focus();
      }
      else {
        control.blur();
      }
    }, action.type);
  }
  else if (action.type === 'fill') {
    await page.evaluate(() => window.componentsHydrationProbe.api!.readRefs().editor!.focus());
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(action.value);
  }
  else if (action.type === 'root-click') {
    await page.locator('[data-hydration-control] .ant-select').click();
  }
  else if (action.type === 'close-dispose') {
    return page.evaluate(() => {
      const state = window.componentsHydrationProbe;
      const editor = state.api!.readRefs().editor!;
      editor.dispatchEvent(new KeyboardEvent(
        'keydown',
        { key: 'Escape', code: 'Escape', which: 27, keyCode: 27, bubbles: true, cancelable: true }
      ));
      state.flushUpdate!({ type: 'alive', value: false });
      return state.observe!();
    });
  }
  else {
    await page.evaluate(action => window.componentsHydrationProbe.flushUpdate!(action), action);
  }
}
