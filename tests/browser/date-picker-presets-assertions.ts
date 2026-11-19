import assert from 'node:assert/strict';
import type { DatePickerPresetSample } from './date-picker-presets-cases.mjs';
import type {
  DatePickerPresetCallbackInvocation,
  DatePickerPresetNode,
  DatePickerPresetOwner,
  DatePickerPresetPoint,
  DatePickerPresetValue,
  readDatePickerPresetsCleanup
} from './date-picker-presets-metrics.mjs';
import {
  datePickerPresetsEncodedArray as encodedArray,
  datePickerPresetsRawRoot as rawRoot,
  verifyDatePickerPresetsSourceOwner
} from './date-picker-presets-reference';

type Cleanup = ReturnType<typeof readDatePickerPresetsCleanup>;
type Dictionary = Record<string, unknown>;
export interface DatePickerPresetsIdentityProof {
  sourceToNative: Map<number, number>;
  nativeToSource: Map<number, number>;
}
export interface DatePickerPresetsDisposalTrace {
  operations: Array<{
    operation: 'beforeUnmount-read' | 'dispose-start' | 'dispose-finished'
      | 'cleanup-read' | 'late-1000-read';
    alive?: boolean;
  }>;
}
export interface DatePickerPresetsDisposal {
  beforeUnmount: DatePickerPresetPoint;
  cleanup: Cleanup;
  late: Cleanup;
  trace: DatePickerPresetsDisposalTrace;
}
const nonDOMCallbacks = new Set(['calendar', 'change', 'open', 'clear', 'panel', 'picker-value', 'ok']);
export type DatePickerPresetsRenderer = 'vite-hmr' | 'no-hmr';
const scopes: Record<DatePickerPresetsRenderer, string> = {
  'vite-hmr': 's-GskOj-VeaTxB', 'no-hmr': 'svelte-1wa7vy5'
};
const counters = {
  measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null
};
function record(value: unknown): Dictionary {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Dictionary;
}
// Подтверждает форму массива, оставляя его элементы неизвестными до отдельной проверки.
function array(value: unknown): unknown[] {
  assert(Array.isArray(value));
  return value;
}
function property(graph: unknown, key: string) {
  return array(rawRoot(graph).properties).map(record).find(row => row.key === key)?.value;
}
// Ищет атрибут по имени. Отсутствующий атрибут остаётся null для сравнения снимков.
function attribute(node: Pick<DatePickerPresetNode, 'attributes'> | null, name: string) {
  return node?.attributes.find(([key]) => key === name)?.[1] ?? null;
}
function hasClass(node: DatePickerPresetNode, name: string) {
  return attribute(node, 'class')?.split(' ').includes(name) ?? false;
}
export function createDatePickerPresetsIdentityProof(): DatePickerPresetsIdentityProof {
  return { sourceToNative: new Map(), nativeToSource: new Map() };
}
function dateSnapshot(value: DatePickerPresetValue) {
  if (value.temporal === null) {
    assert(value.encoded === null || record(value.encoded).$ === 'undefined');
    assert.equal(value.identity, null);
    return;
  }
  assert.equal(value.temporal.isDayjs, true);
  assert.equal(value.temporal.valid, true);
  assert(Number.isFinite(value.temporal.epoch));
  assert.equal(new Date(value.temporal.epoch).toISOString(), value.temporal.iso);
  // JSON пишет -0 как 0; оба значения обозначают тот же UTC-offset.
  assert(value.temporal.utcOffset === 0);
  assert.equal(value.temporal.fields.length, 7);
  assert.equal(rawRoot(value.raw).id, value.identity);
}
export function verifyDatePickerPresetsReturnedDate(
  native: DatePickerPresetValue,
  source: DatePickerPresetValue,
  proof: DatePickerPresetsIdentityProof,
  label: string
) {
  dateSnapshot(native);
  dateSnapshot(source);
  if (native.temporal && source.temporal) {
    assert.deepEqual(Object.keys(native.temporal), Object.keys(source.temporal),
      label + ' complete temporal fields');
    assert.equal(native.temporal.utcOffset === source.temporal.utcOffset, true,
      label + ' numeric UTC offset');
    for (const key of ['isDayjs', 'valid', 'epoch', 'iso', 'fields'] as const) {
      assert.deepEqual(native.temporal[key], source.temporal[key], label + '/Dayjs/' + key);
    }
  }
  else {
    assert.deepEqual(native.temporal, source.temporal, label + ' nullable Dayjs value');
  }
  assert.deepEqual(
    native.sameAsLazyReturns,
    source.sameAsLazyReturns,
    label + ' actual return aliases'
  );
  if (source.identity === null || native.identity === null) {
    assert.equal(native.identity, source.identity);
    return;
  }
  const previousNative = proof.sourceToNative.get(source.identity);
  const previousSource = proof.nativeToSource.get(native.identity);
  if (previousNative !== undefined) assert.equal(native.identity, previousNative, label + ' alias');
  if (previousSource !== undefined) {
    assert.equal(
      source.identity,
      previousSource,
      label + ' distinct date'
    );
  }
  proof.sourceToNative.set(source.identity, native.identity);
  proof.nativeToSource.set(native.identity, source.identity);
}
function validateNativeOwner(owner: DatePickerPresetOwner) {
  dateSnapshot(owner.value);
  assert.equal(owner.events.length, owner.rawEvents.length);
  assert.equal(owner.events.length, owner.callbackInvocations.length);
  for (const [index, invocation] of owner.callbackInvocations.entries()) {
    assert(nonDOMCallbacks.has(invocation.name) || ['focus', 'blur'].includes(invocation.name));
    const args = encodedArray(invocation.arguments);
    const event = encodedArray(owner.events[index]);
    assert.equal(invocation.actualArgumentCount, args.length);
    assert.equal(property(invocation.rawArguments, 'length'), args.length);
    assert.equal(rawRoot(invocation.rawArguments).array, true);
    assert.equal(event[0], invocation.name);
    assert.deepEqual(event.slice(1), args);
  }
  for (const item of owner.lazyCalls) {
    const call = record(item);
    assert.equal(call.actualArgumentCount, 0);
    assert.deepEqual(encodedArray(call.arguments), []);
    assert.equal(property(call.rawArgumentsObject, 'length'), 0);
    assert.equal(rawRoot(call.rawArgumentsObject).array, false);
    assert.deepEqual(call.receiver, { isUndefined: true, isNull: false, type: 'undefined' });
    const result = call.result as DatePickerPresetValue;
    dateSnapshot(result);
    assert.equal(result.sameAsLazyReturns.at(-1), true);
  }
}
function callbackArguments(call: DatePickerPresetCallbackInvocation, native: boolean) {
  const args = encodedArray(call.arguments);
  if (call.name === 'calendar') {
    assert.equal(args.length, 3);
    assert.deepEqual(args[2], native
      ? { $: 'object', properties: [{ key: 'source', value: 'date' }] }
      : { $: 'object', properties: [] });
    return { date: true, text: args[1] };
  }
  if (['change', 'panel', 'picker-value', 'ok'].includes(call.name)) {
    return { date: true, tail: args.slice(1) };
  }
  return args;
}
function callbackShape(owner: DatePickerPresetOwner, native: boolean) {
  return owner.callbackInvocations.filter(call => nonDOMCallbacks.has(call.name)).map(call => ({
    name: call.name, actionIndex: call.actionIndex, actualArgumentCount: call.actualArgumentCount,
    arguments: callbackArguments(call, native)
  }));
}
function sourceInputHooks(owner: Pick<DatePickerPresetOwner, 'callbackInvocations'>) {
  return owner.callbackInvocations.filter(call => ['focus', 'blur'].includes(call.name)).filter(call => {
    assert.equal(call.actualArgumentCount, 2);
    const event = record(encodedArray(call.arguments)[0]);
    const target = record(array(event.properties).map(record).find(row => row.key === 'target')?.value);
    assert.equal(target.$, 'dom-node');
    const attrs = array(target.attributes) as Array<[string, string]>;
    if (target.nodeName === 'INPUT') {
      assert(attrs.some(([key, value]) => key === 'id' && value === 'preset-field'));
      return true;
    }
    assert.equal(target.nodeName, 'DIV');
    assert(attrs.some(([key, value]) => key === 'class'
      && value.split(' ').some(name => name.endsWith('-panel-container'))));
    return false;
  }).map(call => ({ name: call.name, actionIndex: call.actionIndex }));
}
function nativeInputHooks(owner: Pick<DatePickerPresetOwner, 'callbackInvocations'>) {
  return owner.callbackInvocations.filter(call => ['focus', 'blur'].includes(call.name)).map(call => {
    assert.equal(call.actualArgumentCount, 1);
    assert.equal(record(encodedArray(call.arguments)[0]).$, 'object');
    return { name: call.name, actionIndex: call.actionIndex };
  });
}
function compareOwners(
  native: DatePickerPresetOwner,
  source: DatePickerPresetOwner,
  proof: DatePickerPresetsIdentityProof,
  label: string,
  compareFocus = true
) {
  validateNativeOwner(native);
  verifyDatePickerPresetsSourceOwner(source);
  assert.equal(native.alive, source.alive);
  assert.equal(native.open, source.open);
  assert.equal(native.preview, source.preview);
  verifyDatePickerPresetsReturnedDate(native.value, source.value, proof, label + '/value');
  assert.deepEqual(
    callbackShape(native, true),
    callbackShape(source, false),
    label + ' public callbacks'
  );
  assert.equal(native.callbackDates.length, source.callbackDates.length);
  const dateNames = ['calendar', 'change', 'panel', 'picker-value', 'ok'];
  const nativeInvocations = native.callbackInvocations.filter(call => dateNames.includes(call.name));
  const sourceInvocations = source.callbackInvocations.filter(call => dateNames.includes(call.name));
  for (const [index, item] of native.callbackDates.entries()) {
    const current = record(item), original = record(source.callbackDates[index]);
    assert.equal(current.name, original.name);
    assert.equal(current.text, original.text);
    const value = current.value as DatePickerPresetValue;
    const sourceValue = original.value as DatePickerPresetValue;
    verifyDatePickerPresetsReturnedDate(value, sourceValue, proof, label + '/callback' + index);
    if (value.identity !== null) {
      assert.equal(record(property(nativeInvocations[index].rawArguments, '0')).ref, value.identity);
      assert.equal(
        record(property(sourceInvocations[index].rawArguments, '0')).ref,
        sourceValue.identity
      );
    }
    if (current.name === 'calendar') {
      assert.deepEqual(current.actualInfo, {
        $: 'object', properties: [{ key: 'source', value: 'date' }]
      });
      assert.deepEqual(current.ownInfo, [{
        key: 'source', enumerable: true, configurable: true, writable: true,
        kind: 'value', valueType: 'string'
      }]);
    }
  }
  assert.equal(native.lazyCalls.length, source.lazyCalls.length);
  for (const [index, item] of native.lazyCalls.entries()) {
    const call = record(item), original = record(source.lazyCalls[index]);
    for (const key of ['id', 'index', 'actionIndex']) assert.equal(call[key], original[key]);
    assert.deepEqual(call.argumentOwnDescriptors, original.argumentOwnDescriptors);
    verifyDatePickerPresetsReturnedDate(call.result as DatePickerPresetValue, original.result as DatePickerPresetValue,
      proof, label + '/lazy' + index);
  }
  if (compareFocus) assert.deepEqual(nativeInputHooks(native), sourceInputHooks(source));
}
function physicalFocus(point: DatePickerPresetPoint, prefix: string) {
  const node = point.activeElement;
  assert(node && node.connected);
  if (node.tag === 'BODY') {
    return { kind: 'body', tag: 'BODY' };
  }
  if (node.tag === 'INPUT' && attribute(node, 'id') === 'preset-field') {
    return { kind: 'input', tag: 'INPUT' };
  }
  if (node.tag === 'DIV' && hasClass(node, prefix + '-panel-container')) {
    return { kind: 'panel-container', tag: 'DIV', tabindex: attribute(node, 'tabindex') };
  }
  assert.equal(node.tag, 'BUTTON');
  assert.notEqual(attribute(node, 'data-picker-outside'), null);
  return { kind: 'authored-outside', tag: 'BUTTON' };
}
function cells(point: DatePickerPresetPoint, prefix: string) {
  return point.cells.map(node => ({
    title: attribute(node, 'title'), selected: hasClass(node, prefix + '-cell-selected'),
    hover: hasClass(node, prefix + '-cell-hover'), disabled: hasClass(
      node,
      prefix + '-cell-disabled'
    ),
    inView: hasClass(node, prefix + '-cell-in-view'), today: hasClass(node, prefix + '-cell-today')
  }));
}
function physicalNode(native: DatePickerPresetNode, source: DatePickerPresetNode, label: string) {
  for (const key of ['css', 'box', 'metrics', 'styleAttribute', 'cssText', 'inlineProperties'] as const) {
    assert.deepEqual(native[key], source[key], label + '/' + key);
  }
}
export interface DatePickerPresetsPhysical {
  presets: DatePickerPresetNode[]; authoredLabels: DatePickerPresetNode[];
  popups: Array<{ allElements: DatePickerPresetNode[] }>;
}
export function verifyDatePickerPresetsPhysical(
  native: DatePickerPresetsPhysical,
  source: DatePickerPresetsPhysical,
  label: string,
  renderer: DatePickerPresetsRenderer
) {
  const scopeClass = scopes[renderer];
  assert.equal(native.presets.length, source.presets.length);
  const elements = native.popups.flatMap(popup => popup.allElements);
  for (const [index, row] of native.presets.entries()) {
    const original = source.presets[index];
    assert.equal(row.tag, 'LI');
    assert.deepEqual(original.attributes, []);
    assert.deepEqual(row.attributes, renderer === 'vite-hmr' ? [['class', scopeClass]] : []);
    assert.equal(row.text, original.text, label + '/label text');
    assert.deepEqual(row.children?.map(child => ({
      type: child.type,
      name: child.name,
      text: child.text
    })),
      [{ type: 1, name: 'BUTTON', text: null }]);
    const buttons = elements.filter(node => node.parentIdentity === row.identity);
    assert.equal(buttons.length, 1);
    assert.equal(buttons[0].tag, 'BUTTON');
    assert.deepEqual(buttons[0].attributes, [['type', 'button'], ['class', scopeClass]]);
    const sourceChildren = original.children;
    assert(sourceChildren);
    const openButton = `<button type="button" class="${scopeClass}">`;
    const shape = buttons[0].children?.map(child => ({
      type: child.type, name: child.name, text: child.text
    }));
    const comment = { type: 8, name: '#comment', text: null };
    const empty = { type: 3, name: '#text', text: '' };
    if (sourceChildren.some(child => child.type === 1)) {
      assert.equal(sourceChildren.length, 1);
      assert.equal(sourceChildren[0].name, 'SPAN');
      const span = source.authoredLabels.find(node => node.identity === sourceChildren[0].identity);
      assert(span);
      const count = renderer === 'vite-hmr' ? 3 : 2;
      assert.deepEqual(shape, [
        ...Array.from({ length: count }, () => comment),
        { type: 1, name: 'SPAN', text: null },
        ...Array.from({ length: count }, () => empty), comment
      ]);
      assert.equal(buttons[0].html,
        openButton + '<!---->'.repeat(count) + span.html + '<!----></button>');
    }
    else {
      assert.deepEqual(shape, [{ type: 3, name: '#text', text: original.text }, comment]);
      const sourceHTML = original.html;
      assert(typeof sourceHTML === 'string');
      assert(sourceHTML.startsWith('<li>') && sourceHTML.endsWith('</li>'));
      assert.equal(buttons[0].html, openButton + sourceHTML.slice(4, -5) + '<!----></button>');
    }
    physicalNode(row, original, label + '/row' + index);
  }
  assert.equal(native.authoredLabels.length, source.authoredLabels.length);
  for (const [index, node] of native.authoredLabels.entries()) {
    const original = source.authoredLabels[index];
    assert.equal(node.html, original.html, label + ' complete authored label subtree');
    physicalNode(node, original, label + '/custom label' + index);
  }
}
function validationOrder(
  owner: Pick<DatePickerPresetOwner, 'calls' | 'callbackInvocations'>,
  sample: DatePickerPresetSample
) {
  const results: Array<{ actionIndex: number; result: unknown }> = [];
  for (const call of owner.callbackInvocations) {
    if (call.name !== 'calendar' || sample.actions[call.actionIndex]?.type !== 'preset-click') continue;
    const date = record(property(call.rawArguments, '0'));
    const validation = owner.calls.map(record).find(row => row.kind === 'disabledDate'
      && record(property(row.rawArgument, '0')).ref === date.ref);
    assert(validation, 'Actual validation of this same Date exists');
    assert((rawRoot(validation.rawArgument).id as number)
      > (rawRoot(call.rawArguments).id as number), 'FIRST actual same-Date validation follows calendar');
    const change = owner.callbackInvocations.find(row => row.name === 'change'
      && row.actionIndex === call.actionIndex);
    if (change) {
      assert((rawRoot(validation.rawArgument).id as number)
        < (rawRoot(change.rawArguments).id as number), 'Actual validation precedes change');
    }
    results.push({ actionIndex: call.actionIndex, result: validation.result });
  }
  return results;
}
export function verifyDatePickerPresetsValidationOrder(
  native: Pick<DatePickerPresetOwner, 'calls' | 'callbackInvocations'>,
  source: Pick<DatePickerPresetOwner, 'calls' | 'callbackInvocations'>,
  sample: DatePickerPresetSample
) {
  assert.equal(sample.id, 'static-validity');
  assert.deepEqual(validationOrder(native, sample), validationOrder(source, sample));
}
/** Полные raw остаются отдельно; здесь проверяются измеренные callbacks, данные и видимые presets. */
export function verifyDatePickerPresetsPoint(
  native: DatePickerPresetPoint,
  source: DatePickerPresetPoint,
  sample: DatePickerPresetSample,
  label: string,
  proof: DatePickerPresetsIdentityProof,
  renderer: DatePickerPresetsRenderer
) {
  compareOwners(native.owner, source.owner, proof, label);
  assert.equal(native.environment.timezone, 'UTC');
  assert(native.root?.connected && native.input?.connected);
  assert(native.sameRoot && native.sameInput && native.publicRef.controlPresent);
  assert.equal(native.publicRef.nativeElementIdentity, native.root.identity);
  assert.equal(native.input.value, source.input?.value, label + ' displayed input');
  assert.equal(Boolean(native.clear), Boolean(source.clear), label + ' clear affordance');
  const prefix = sample.prefixCls ?? 'ant-picker';
  const nativeParent = native.rootElements.find(node => node.identity === native.input?.parentIdentity);
  const sourceParent = source.rootElements.find(node => node.identity === source.input?.parentIdentity);
  assert(nativeParent && sourceParent);
  assert.equal(hasClass(nativeParent, prefix + '-input-placeholder'),
    hasClass(sourceParent, prefix + '-input-placeholder'));
  const invalid = attribute(native.input, 'aria-invalid');
  const sourceInvalid = attribute(source.input, 'aria-invalid');
  // Native сохраняет прежний HTML binding: false опускается; Source пишет строку false.
  assert(invalid === null || invalid === 'true');
  assert(sourceInvalid === 'false' || sourceInvalid === 'true');
  assert.equal(invalid === 'true', sourceInvalid === 'true');
  assert.deepEqual(physicalFocus(native, prefix), physicalFocus(source, prefix));
  if (native.owner.open) {
    assert.equal(native.popups.filter(popup => popup.visible).length, 1);
    assert.equal(source.popups.filter(popup => popup.visible).length, 1);
    assert.equal(native.cells.length, 42);
    assert.equal(source.cells.length, 42);
    assert.deepEqual(cells(native, prefix), cells(source, prefix), label + ' all calendar cells');
    verifyDatePickerPresetsPhysical(native, source, label, renderer);
  }
  else {
    // Прежний Native popup удаляется; Source сохраняет скрытое дерево rc-trigger.
    assert.equal(native.popups.length, 0);
    assert(source.popups.every(popup => !popup.visible));
  }
  if (sample.id === 'static-validity') {
    verifyDatePickerPresetsValidationOrder(native.owner, source.owner, sample);
  }
  assert.deepEqual(native.browserOwnedResourceCounters, counters);
}
function removed(value: Cleanup) {
  assert.equal(value.owner.alive, false);
  assert.deepEqual(value.refs, { control: true, root: true, owner: true });
  assert.equal(value.ownerCount, 0);
  assert.equal(value.popupCount, 0);
  assert(value.retained.some(node => node.owned));
  assert(value.retained.filter(node => node.owned).every(node => !node.connected));
  assert.deepEqual(value.browserOwnedResourceCounters, counters);
}
/** Допускается только фактически измеренный connected blur внутри явного public-unmount интервала. */
export function verifyDatePickerPresetsDisposal(
  native: DatePickerPresetsDisposal,
  source: Omit<DatePickerPresetsDisposal, 'trace'>,
  sample: DatePickerPresetSample,
  label: string,
  proof: DatePickerPresetsIdentityProof,
  renderer: DatePickerPresetsRenderer
) {
  verifyDatePickerPresetsPoint(native.beforeUnmount, source.beforeUnmount, sample,
    label + '/beforeUnmount', proof, renderer);
  assert.deepEqual(native.trace.operations.map(row => row.operation), [
    'beforeUnmount-read', 'dispose-start', 'dispose-finished', 'cleanup-read', 'late-1000-read'
  ]);
  assert.equal(native.trace.operations[0].alive, true);
  assert.equal(native.trace.operations[3].alive, false);
  assert.equal(native.trace.operations[4].alive, false);
  removed(native.cleanup);
  removed(native.late);
  assert.deepEqual(native.late, native.cleanup, label + ' full Native late silence');
  assert.deepEqual(source.late, source.cleanup, label + ' full Source late silence');
  for (const phase of ['cleanup', 'late'] as const) {
    compareOwners(native[phase].owner, source[phase].owner, proof, label + '/' + phase, false);
  }
  verifyDatePickerPresetsRemovalBlur(native.beforeUnmount, native.cleanup.owner,
    source.beforeUnmount, source.cleanup.owner, sample, label);
}
export interface DatePickerPresetsRemovalBefore {
  input: Pick<DatePickerPresetNode, 'identity' | 'focused'> | null;
  activeElement: Pick<DatePickerPresetNode, 'identity' | 'tag' | 'attributes'> | null;
  owner: Pick<DatePickerPresetOwner, 'alive' | 'callbackInvocations'>;
}
;
/** Prefix и фактические поля Native FocusEvent запрещают общий disposal-blur waiver. */
export function verifyDatePickerPresetsRemovalBlur(
  nativeBefore: DatePickerPresetsRemovalBefore,
  nativeAfter: Pick<DatePickerPresetOwner, 'alive' | 'callbackInvocations'>,
  sourceBefore: DatePickerPresetsRemovalBefore,
  sourceAfter: Pick<DatePickerPresetOwner, 'alive' | 'callbackInvocations'>,
  sample: DatePickerPresetSample,
  label: string
) {
  assert.equal(nativeBefore.owner.alive, true);
  assert.equal(sourceBefore.owner.alive, true);
  assert.equal(nativeAfter.alive, false);
  assert.equal(sourceAfter.alive, false);
  const sourceHooks = sourceInputHooks(sourceAfter);
  const nativeHooks = nativeInputHooks(nativeAfter);
  if (nativeHooks.length === sourceHooks.length) {
    assert.deepEqual(nativeHooks, sourceHooks);
    return;
  }
  assert(['lazy-hover-click', 'preview-false-and-switch', 'time-confirm-preset'].includes(sample.id));
  assert(nativeBefore.input?.focused);
  assert.equal(nativeBefore.input.identity, nativeBefore.activeElement?.identity);
  assert.equal(nativeBefore.activeElement?.tag, 'INPUT');
  assert.equal(attribute(nativeBefore.activeElement, 'id'), 'preset-field');
  assert.deepEqual(sourceInputHooks(sourceBefore.owner), sourceHooks);
  assert.deepEqual(nativeInputHooks(nativeBefore.owner), sourceHooks);
  const before = nativeBefore.owner.callbackInvocations;
  const after = nativeAfter.callbackInvocations;
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.slice(0, -1), before, label + ' complete callback prefix');
  const call = after.at(-1);
  assert(call);
  assert.equal(call.name, 'blur');
  assert.equal(call.actualArgumentCount, 1);
  assert.equal(call.actionIndex, sample.actions.length - 1);
  const observed = call.nativeFocus;
  assert(observed);
  assert.deepEqual(observed, {
    type: 'blur', isTrusted: true, ownerAlive: true,
    targetTag: 'INPUT', targetId: 'preset-field', targetConnected: true,
    currentTargetTag: 'INPUT', currentTargetMatchesTarget: true, relatedTargetTag: null
  });
  assert.deepEqual(nativeHooks.slice(0, -1), sourceHooks);
}
