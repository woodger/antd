import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { drainSelectSurface } from './select-surface-driver';
import { readSelectSurface } from './select-surface-metrics';
import { readSelectSurfaceOmission, type SelectSurfaceOmissionDOM, type SelectSurfaceOmissionNodeName } from './select-surface-omission-metrics.mjs';
import { readNativeSurfaceTopology, normalizedSelectSurfaceAuthoredProps, selectSurfaceEventValue,
  verifySelectSurfaceEventGraph, verifySelectSurfaceNode } from './select-surface-assertions';
import { decodeSelectSurface } from './select-surface-receipts';
import type { NativeSelectSurfaceOmissionSample } from './fixtures/select-surface-omission-native-cases';
import type { SelectSurfaceOmissionOwner, SelectSurfaceOmissionPoint, SelectSurfaceOmissionSourceCase,
  SelectSurfaceOmissionLifecycle } from './select-surface-omission-reference';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface NativeSelectSurfaceOmissionOwner extends Omit<SelectSurfaceOmissionOwner,
  'eventCount' | 'rawEventCount' | 'producerCount' | 'lifecycleCount'> {
  alive: boolean;
  events: unknown[];
  rawEvents: unknown[];
  calls: SelectSurfaceProducerCall[];
  lifecycle: SelectSurfaceOmissionLifecycle[];
}
export interface NativeSelectSurfaceOmissionPoint {
  dom: ReturnType<typeof readSelectSurface>;
  omission: SelectSurfaceOmissionDOM;
  owner: NativeSelectSurfaceOmissionOwner;
  topology: ReturnType<typeof readNativeSurfaceTopology>;
  bindings: { root: boolean; editor: boolean; methods: boolean; methodNativeElement: boolean };
}
export async function readNativeOmission(page: Page): Promise<NativeSelectSurfaceOmissionPoint> {
  const dom = await page.evaluate(readSelectSurface);
  const omission = await page.evaluate(readSelectSurfaceOmission);
  const topology = await page.evaluate(readNativeSurfaceTopology);
  const { owner, bindings } = await page.evaluate(() => {
    const owner = {}, refs: { root?: HTMLElement; editor?: HTMLElement; publicRoot?: HTMLElement;
      publicEditor?: HTMLElement; control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown; nativeElement?: HTMLElement } } = {};
    const command = document.querySelector('[data-surface-command]')!;
    command.dispatchEvent(new CustomEvent('omissionread', { detail: owner }));
    command.dispatchEvent(new CustomEvent('surfacerefs', { detail: refs }));
    return { owner: owner as NativeSelectSurfaceOmissionOwner, bindings: {
      root: refs.root === refs.publicRoot, editor: refs.editor === refs.publicEditor,
      methods: ['focus', 'blur', 'scrollTo'].every(key => typeof refs.control?.[key as 'focus'] === 'function'),
      methodNativeElement: Boolean(refs.control && 'nativeElement' in refs.control),
    } };
  });
  return { dom, omission, topology, owner, bindings };
}
export async function settleNativeOmission(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const actual = await readNativeOmission(page), key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Native omission owner, lifecycle, callback ledger and actual DOM did not settle');
}
function lifecycleSummary(entries: readonly SelectSurfaceOmissionLifecycle[]) {
  return Object.fromEntries(['footer-mount', 'footer-unmount', 'footer-ref', 'wrap-ref'].map(kind => {
    const matching = entries.filter(entry => entry.kind === kind);
    return [kind, matching.map(entry => ({ ...(entry.instance === undefined ? {} : { instance: entry.instance }),
      ...(entry.attached === undefined ? {} : { attached: entry.attached }), action: entry.action }))];
  }));
}
export function verifyOmissionLifecycle(actual: readonly SelectSurfaceOmissionLifecycle[],
  source: readonly SelectSurfaceOmissionLifecycle[], label: string) {
  // React ref commits can precede portal connection; Svelte attachments run on the
  // connected public node. Keep both raw order/connection ledgers, compare actual
  // component instances and attach/detach actions independently of framework order.
  assert.deepEqual(lifecycleSummary(actual), lifecycleSummary(source), `${label} real footer instances and ref lifecycle`);
  for (const entry of actual.filter(entry => entry.kind.endsWith('-ref')))
    assert.equal(entry.attached ? typeof entry.connected : entry.connected, entry.attached ? 'boolean' : null,
      `${label} unmodified Native ref connection observation`);
}
function producerMeaning(call: SelectSurfaceProducerCall) {
  return { kind: call.kind, side: call.side, argument: decodeSelectSurface(call.argument),
    result: decodeSelectSurface(call.result), renderer: call.renderer, sameResultAsArgument: call.sameResultAsArgument };
}
export function verifyOmissionProducers(actual: readonly SelectSurfaceProducerCall[], source: readonly SelectSurfaceProducerCall[],
  owner: NativeSelectSurfaceOmissionOwner, label: string) {
  const meanings = (calls: readonly SelectSurfaceProducerCall[]) => [...new Set(calls.map(call => JSON.stringify(producerMeaning(call))))].sort();
  // CSR may repeat pure callbacks. Each complete public argument/result invocation
  // must occur on both sides; full repeated raw prefixes remain attached.
  assert.deepEqual(meanings(actual), meanings(source), `${label} complete public popup argument/result invocation set`);
  for (const call of actual) {
    assert.equal(call.callbackIdentity, owner.popupCallbackIdentity, `${label} stable authored popup callback`);
    const rawArgument = call.rawArgument as { root: { ref: number }; objects: unknown[] };
    assert.equal(rawArgument.root.ref, call.originIdentity, `${label} actual callback origin identity`);
    assert(rawArgument.objects.length > 0 && Object.hasOwn(call, 'rawResult'), `${label} complete raw callback graphs`);
  }
}
export function verifyNativeOmissionPoint(actual: NativeSelectSurfaceOmissionPoint, source: SelectSurfaceOmissionPoint,
  entry: SelectSurfaceOmissionSourceCase, sample: NativeSelectSurfaceOmissionSample, label: string,
  previous?: { actual: NativeSelectSurfaceOmissionPoint; source: SelectSurfaceOmissionPoint }) {
  const failures: string[] = [];
  const check = (name: string, operation: () => void) => {
    try { operation(); } catch (error) { failures.push(`${label}/${name}: ${String(error)}`); }
  };
  const observed = source.omission ?? source.width!;
  const defaultFirstSelect = sample.id === 'select-surface-omission-default-select'
    && sample.control === 'select' && sample.initialPopup === 'omitted';
  const closedDefaultBeforeWrapper = defaultFirstSelect && Boolean(observed.original.popupShell)
    && !observed.original.wrap && !source.owner.open;
  const replacedDefaultShell = defaultFirstSelect && Boolean(observed.original.wrap);
  check('owner', () => {
    assert.equal(actual.owner.alive, true);
    for (const key of ['axis', 'popup', 'model', 'open', 'query', 'fontSize', 'unrelated', 'popupOwnKey', 'popupIsSameCallback'] as const)
      assert.deepEqual(actual.owner[key], source.owner[key], `${label} public ${key}`);
    verifySelectSurfaceEventGraph(actual.owner.rawModel, source.owner.rawModel, `${label} raw public model`);
    const authored = normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps);
    assert.deepEqual(authored, normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps), `${label} complete authored public props`);
    assert.deepEqual(decodeSelectSurface(actual.owner.authoredProvider), decodeSelectSurface(source.owner.authoredProvider), `${label} complete authored provider`);
    if (sample.axis === 'omission') assert.equal(Object.hasOwn(authored, 'popupRender'), source.owner.popupOwnKey,
      `${label} actual own-key omission rather than own undefined`);
  });
  check('events', () => {
    assert.deepEqual(actual.owner.events.map(selectSurfaceEventValue), entry.events.slice(0, source.owner.eventCount).map(selectSurfaceEventValue), `${label} full public callback prefix`);
    assert.equal(actual.owner.rawEvents.length, source.owner.rawEventCount, `${label} complete raw public callback prefix`);
    for (const [index, event] of actual.owner.rawEvents.entries()) verifySelectSurfaceEventGraph(event, entry.rawEvents[index], `${label}/event${index}`);
  });
  check('producer', () => {
    verifyOmissionProducers(actual.owner.calls, entry.producerCalls.slice(0, source.owner.producerCount), actual.owner, label);
    if (previous) {
      assert.equal(actual.owner.popupCallbackIdentity, previous.actual.owner.popupCallbackIdentity, `${label} callback remains the same function`);
      const sourceDelta = source.owner.producerCount - previous.source.owner.producerCount;
      const delta = actual.owner.calls.length - previous.actual.owner.calls.length;
      assert.equal(delta > 0, sourceDelta > 0, `${label} actual eager producer activity at this action`);
    }
  });
  check('retention', () => {
    const expectedSame = { ...observed.sameAsOriginal };
    if (closedDefaultBeforeWrapper) { expectedSame.popupShell = false; expectedSame.list = false; }
    if (replacedDefaultShell) expectedSame.popupShell = false;
    assert.deepEqual(actual.omission.sameAsOriginal, expectedSame, `${label} shell/wrap/footer/editor/list identities`);
    assert.equal(actual.omission.popupCount, closedDefaultBeforeWrapper ? 0 : observed.popupCount, `${label} actual popup count`);
    assert.equal(actual.omission.footerCount, observed.footerCount, `${label} actual footer count`);
    assert.deepEqual(actual.bindings, { root: true, editor: true, methods: true, methodNativeElement: false }, `${label} separate public Native bindings`);
    assert.equal(observed.publicRefs.rootMatches, true, `${label} Original control.nativeElement reference`);
    assert.equal(actual.omission.publicRefs.rootMatches, false, `${label} unaltered raw Native methods-object diagnostic`);
    assert.deepEqual({ footer: actual.omission.publicRefs.footerMatches, wrap: actual.omission.publicRefs.wrapMatches },
      { footer: observed.publicRefs.footerMatches, wrap: observed.publicRefs.wrapMatches }, `${label} actual popup public refs`);
    for (const name of Object.keys(observed.current) as SelectSurfaceOmissionNodeName[]) {
      const current = actual.omission.current[name], original = observed.current[name];
      const absentOldDefault = closedDefaultBeforeWrapper && (name === 'popupShell' || name === 'list');
      assert.equal(Boolean(current), absentOldDefault ? false : Boolean(original), `${label}/${name} actual retained node presence`);
      const disconnectedOldDefault = (name === 'popupShell' && (closedDefaultBeforeWrapper || replacedDefaultShell))
        || (name === 'list' && closedDefaultBeforeWrapper);
      if (disconnectedOldDefault) assert.equal(observed.original[name]?.connected, true,
        `${label}/${name} Original retains its first default popup node`);
      assert.equal(actual.omission.original[name]?.connected ?? null,
        disconnectedOldDefault ? false : observed.original[name]?.connected ?? null,
        `${label}/${name} original connected identity`);
      if (original && !absentOldDefault) {
        assert.equal(current!.connected, original.connected, `${label}/${name} connected`);
        assert.equal(current!.tag, original.tag, `${label}/${name} actual tag`);
        if (name === 'footerInput') {
          assert.equal(current!.value, original.value, `${label} actual uncontrolled footer draft`);
          assert.deepEqual(current!.caret, original.caret, `${label} actual footer caret`);
          assert.deepEqual(current!.attributes, original.attributes, `${label} actual authored footer input attributes`);
        }
      }
      if (name === 'footerInput') assert.equal(actual.omission.original[name]?.value ?? null, observed.original[name]?.value ?? null,
        `${label} detached original footer still contains its actual draft`);
    }
    if (replacedDefaultShell) {
      // Only this default-first Select has the pre-existing conditional default
      // popup lifetime. Its old shell is gone before custom content ever mounts.
      // The new custom shell must then remain the same actual connected node.
      const currentShell = actual.omission.current.popupShell!;
      assert.equal(currentShell.connected, true, `${label} connected custom shell`);
      assert.notEqual(currentShell.identity, actual.omission.original.popupShell?.identity,
        `${label} custom shell differs from removed default shell`);
      const previousSource = previous && (previous.source.omission ?? previous.source.width!);
      if (previousSource?.original.wrap) assert.equal(currentShell.identity,
        previous!.actual.omission.current.popupShell?.identity, `${label} retained custom shell identity after first wrapped open`);
    }
    verifyOmissionLifecycle(actual.owner.lifecycle, (entry.lifecycle ?? []).slice(0, source.owner.lifecycleCount ?? 0), label);
  });
  check('surface', () => {
    const authored = normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps);
    const legacyClasses = typeof authored.className === 'string' ? authored.className.split(/\s+/).filter(Boolean) : [];
    const mode = sample.axis === 'width' ? 'multiple' as const : undefined;
    const control = { control: sample.control, mode };
    assert.equal(actual.topology.publicRootIsInner, sample.control === 'select', `${label} existing public root ownership`);
    assert.equal(actual.topology.rootHasEditor, true);
    for (const name of legacyClasses) assert(actual.topology.outerClasses.includes(name));
    assert.deepEqual(Object.keys(actual.dom.view.slots), Object.keys(source.dom.view.slots));
    for (const [slot, nodes] of Object.entries(source.dom.view.slots)) {
      if (closedDefaultBeforeWrapper && slot.startsWith('popup.')) {
        assert.equal(actual.dom.view.slots[slot].length, 0, `${label}/${slot} old conditional default popup lifetime`);
        continue;
      }
      assert.equal(actual.dom.view.slots[slot].length, nodes.length, `${label}/${slot} exact semantic node count`);
      for (const [index, node] of nodes.entries()) verifySelectSurfaceNode(actual.dom.view.slots[slot][index], node, slot, control,
        legacyClasses, `${label}/${index}`, source.dom.raw.slots[slot][index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
        { callerLabel: authored['aria-label'], inputLayout: actual.topology.editorLayout, raw: actual.dom.raw.slots[slot][index] });
    }
    assert.equal(actual.topology.rootTextWithoutChildPopup, source.dom.view.slots.root[0].text, `${label} painted root text`);
    assert.deepEqual({ present: actual.dom.view.popup.present, visible: actual.dom.view.popup.visible },
      { present: closedDefaultBeforeWrapper ? false : source.dom.view.popup.present, visible: source.dom.view.popup.visible },
      `${label} actual custom popup visibility/lifetime`);
    assert.equal(actual.dom.view.popup.extras.length, source.dom.view.popup.extras.length, `${label} every authored popup node`);
    for (const [index, node] of source.dom.view.popup.extras.entries()) verifySelectSurfaceNode(actual.dom.view.popup.extras[index], node,
      'extra', control, [], `${label}/extra${index}`, source.dom.raw.extras[index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
      { callerLabel: authored['aria-label'], raw: actual.dom.raw.extras[index] });
    assert.deepEqual(actual.dom.view.leaks, []);
    assert.equal(actual.dom.view.focus, source.dom.view.focus, `${label} actual focused public node`);
    let editor = source.dom.view.editor;
    if (sample.control === 'select' && !mode && (editor.expanded === 'false' || editor.readonly)) {
      assert.equal(editor.value, '');
      const labelText = source.dom.view.slots.content[0]?.text ?? '';
      const model = decodeSelectSurface(source.owner.model);
      const text = typeof model === 'string' || typeof model === 'number' ? labelText : '';
      editor = { ...editor, value: text, caret: [text.length, text.length] };
    }
    assert.deepEqual(actual.dom.view.editor, editor, `${label} actual editor with existing single Native label/caret contract`);
  });
  check('authored-popup-geometry', () => {
    for (const name of ['wrap', 'footer', 'footerInput'] as const) {
      const current = actual.omission.current[name], original = observed.current[name];
      assert.equal(Boolean(current), Boolean(original), `${label}/${name} actual custom node presence`);
      if (original) {
        assert.deepEqual(current!.box, original.box, `${label}/${name} actual custom geometry`);
        assert.deepEqual(current!.css, original.css, `${label}/${name} actual custom computed style`);
      }
    }
  });
  if (sample.axis === 'width') check('width', () => {
    const current = actual.omission.current.editor!, original = observed.current.editor!;
    assert.equal(current.value, original.value, `${label} actual displayed nonempty query`);
    assert.deepEqual(current.box, original.box, `${label} actual measured width history`);
    for (const property of ['width', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight'])
      assert.equal(current.css[property], original.css[property], `${label} actual input ${property}`);
    // Framework private width custom-property names remain untouched in both raw
    // CSSOM traces; the physical query/font/width are compared without correction.
  });
  return failures;
}
