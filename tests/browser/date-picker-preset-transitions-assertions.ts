import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import {
  datePickerPresetTransitionsEncodedArray as encodedArray,
  datePickerPresetTransitionsRawRoot as rawRoot,
  verifyDatePickerPresetTransitionsSourceOwner,
  verifyDatePickerPresetTransitionsSourcePoint
} from './date-picker-preset-transitions-reference';
import type {
  DatePickerPresetTransitionsSourceOwner as SourceOwner,
  DatePickerPresetTransitionsSourcePoint as SourcePoint,
  DatePickerPresetTransitionsSourceValue as SourceDate,
  DatePickerPresetTransitionsSourceCleanup as SourceCleanup,
  DatePickerPresetTransitionsSSRSerialization as SourceSSR
} from './date-picker-preset-transitions-reference';
import type {
  DatePickerPresetTransitionOwner as NativeOwner,
  DatePickerPresetTransitionPoint as NativePoint,
  DatePickerPresetTransitionDate as NativeDate,
  DatePickerPresetTransitionCallback as NativeInvocation,
  DatePickerPresetTransitionCleanup as NativeCleanup,
  DatePickerPresetTransitionNode as NativeNode,
  DatePickerPresetTransitionSample as Sample
} from './date-picker-preset-transitions-native-types';

type Dictionary = Record<string, unknown>;
type AnyNode = NonNullable<SourcePoint['root']> | NativeNode;
const dateNames = new Set(['calendar', 'change', 'panel', 'picker-value', 'ok']);
const focusNames = new Set(['focus', 'blur']);
const authoredNames = [
  'initialValue', 'defaultPickerValue', 'initialPickerValue', 'initialMinDate',
  'updatedMinDate', 'maxDate', 'presetValue'
] as const;
const arities: Record<string, number> = {
  calendar: 3, change: 2, open: 1, panel: 2, 'picker-value': 2, ok: 1,
  clear: 0, focus: 1, blur: 1
};
const counters = {
  measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null
};
const sourceReceiver = { isUndefined: true, isNull: false, type: 'undefined' };
const nativeReceiver = { isUndefined: false, isNull: false, type: 'object' };

export const datePickerPresetTransitionBoundaries = Object.freeze({
  focus: 'Source React composite two-argument focus/blur versus actual lowercase Native HTMLInput one-argument hooks; panel hooks are Source-only',
  receiver: 'Source public callback receiver is undefined; actual pre-existing Native props-function receiver is a non-null object',
  calendarInfo: 'Source calendar info is {}; actual Native calendar info remains exactly {source:"date"} for this frozen axis',
  control: 'Source composite handles/methods change across renders; Native component and focus/blur methods remain stable',
  closedPopup: 'Source retains hidden stale popup DOM; Native removes it; compare current state/ledgers/input/form while closed',
  headers: 'Compare actual month/year button leaf text separately; retain complete header text/HTML including whitespace',
  timeRows: 'Read actual Native column aria-label and button aria-label/text; Source data-type/data-value are never injected',
  pureProducers: 'Validate complete actual producer ledgers locally; do not synthesize Source calls or assert equal render multiplicity',
  initialCaret: 'Only initial closed/alive owners with empty callback/action ledgers, BODY focus and an unfocused input collapsed at value.length have Native none versus Source forward direction; all later caret fields are strict',
  providerLocale: 'Source uses its implicit English default; the Native ordinary caller explicitly supplies enUS while preserving the library default',
  producerArity: 'Native validation disabledTime receives exactly (actual Dayjs,start,{own from:undefined}) on its natural object receiver; the measured panel path keeps exactly one Dayjs argument. Both forms are observed in Source; pure call multiplicity remains independent',
  loading: 'ResourceTiming and asset/network loading remain raw renderer observations; browser-owned counters remain unmeasured/null'
});

export interface DatePickerPresetTransitionProof {
  sourceToNativeDate: Map<number, number>;
  nativeToSourceDate: Map<number, number>;
  nativeRoot?: number;
  nativeInput?: number;
  nativeControl?: number;
  nativeFocus?: number;
  nativeBlur?: number;
  nativeControlOwnKeys?: string[];
}
export function createDatePickerPresetTransitionProof(): DatePickerPresetTransitionProof {
  return { sourceToNativeDate: new Map(), nativeToSourceDate: new Map() };
}
function record(value: unknown): Dictionary {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Dictionary;
}
function array(value: unknown): unknown[] {
  assert(Array.isArray(value));
  return value;
}
function rawProperty(graph: unknown, name: string) {
  return array(rawRoot(graph).properties).map(record).find(row => row.key === name)?.value;
}
function encodedProperty(value: unknown, name: string) {
  return array(record(value).properties).map(record).find(row => row.key === name)?.value;
}
function attr(node: Pick<AnyNode, 'attributes'> | null, name: string) {
  return node?.attributes.find(([key]) => key === name)?.[1] ?? null;
}
function hasClass(node: AnyNode, name: string) {
  return attr(node, 'class')?.split(' ').includes(name) ?? false;
}
function dateSnapshot(value: NativeDate | SourceDate) {
  assert.deepEqual(
    Object.keys(value),
    ['encoded', 'raw', 'temporal', 'identity', 'sameAsAuthoredDates']
  );
  assert.deepEqual(Object.keys(value.sameAsAuthoredDates), authoredNames);
  if (value.temporal === null) {
    assert.equal(value.identity, null);
    assert(value.encoded === null || record(value.encoded).$ === 'undefined');
    assert.deepEqual(record(value.raw).root, value.encoded);
    assert.deepEqual(record(value.raw).objects, []);
    return;
  }
  const temporal = value.temporal;
  assert.equal(temporal.isDayjs, true);
  assert.equal(temporal.valid, true);
  assert(Number.isFinite(temporal.epoch));
  const instant = new Date(temporal.epoch);
  assert.equal(instant.toISOString(), temporal.iso);
  assert.deepEqual(temporal.fields, [
    instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate(), instant.getUTCHours(),
    instant.getUTCMinutes(), instant.getUTCSeconds(), instant.getUTCMilliseconds()
  ]);
  // This is the only numeric equivalence: JSON 0 and live UTC-offset -0 are both UTC.
  assert(temporal.utcOffset === 0);
  assert.equal(rawRoot(value.raw).id, value.identity);
  assert(Number.isSafeInteger(value.identity) && value.identity! > 0);
}
export function verifyDatePickerPresetTransitionDate(
  native: NativeDate, source: SourceDate, proof: DatePickerPresetTransitionProof, label: string
) {
  dateSnapshot(native);
  dateSnapshot(source);
  assert.deepEqual(native.encoded, source.encoded, label + ' encoded value and authored role');
  assert.deepEqual(
    native.sameAsAuthoredDates,
    source.sameAsAuthoredDates,
    label + ' actual authored aliases'
  );
  if (native.temporal && source.temporal) {
    assert.deepEqual(Object.keys(native.temporal), Object.keys(source.temporal));
    for (const key of ['isDayjs', 'valid', 'epoch', 'iso', 'fields'] as const)
      assert.deepEqual(native.temporal[key], source.temporal[key], label + '/' + key);
    assert(native.temporal.utcOffset === 0 && source.temporal.utcOffset === 0);
    assert.deepEqual(rawRoot(native.raw).authoredRole, rawRoot(source.raw).authoredRole,
      label + ' complete raw authored role');
  }
  else assert.equal(native.temporal, source.temporal, label + ' nullable temporal value');
  if (native.identity === null || source.identity === null) {
    assert.equal(native.identity, source.identity, label + ' nullable identity');
    return;
  }
  const mappedNative = proof.sourceToNativeDate.get(source.identity);
  const mappedSource = proof.nativeToSourceDate.get(native.identity);
  if (mappedNative !== undefined) {
    assert.equal(
      native.identity,
      mappedNative,
      label + ' stable date alias'
    );
  }
  if (mappedSource !== undefined) {
    assert.equal(
      source.identity,
      mappedSource,
      label + ' distinct date identity'
    );
  }
  proof.sourceToNativeDate.set(source.identity, native.identity);
  proof.nativeToSourceDate.set(native.identity, source.identity);
}
function nativeDateAliases(value: NativeDate, owner: NativeOwner) {
  dateSnapshot(value);
  for (const name of authoredNames) {
    const authored = owner.authoredDates[name];
    const expected = value.temporal === null && authored.temporal === null
      ? isDeepStrictEqual(value.encoded, authored.encoded)
      : value.identity !== null && value.identity === authored.identity;
    assert.equal(value.sameAsAuthoredDates[name], expected, 'Native actual authored alias: ' + name);
  }
}
function validateNativeOwner(owner: NativeOwner) {
  assert.deepEqual(Object.keys(owner.authoredDates), authoredNames);
  for (const value of [owner.value, owner.pickerValue, owner.minDate, ...Object.values(owner.authoredDates)])
    nativeDateAliases(value, owner);
  assert.equal(owner.events.length, owner.callbackInvocations.length);
  assert.equal(owner.rawEvents.length, owner.callbackInvocations.length);
  const argumentRoots = new Set<unknown>();
  for (const [index, call] of owner.callbackInvocations.entries()) {
    // Unknown callbacks fail before filtering; none can disappear from the compared stream.
    assert(Object.hasOwn(arities, call.name), 'Unknown Native public callback: ' + call.name);
    const args = encodedArray(call.arguments);
    assert.equal(
      call.actualArgumentCount,
      arities[call.name],
      call.name + ' strict Native API arity'
    );
    assert.equal(args.length, call.actualArgumentCount);
    const root = rawRoot(call.rawArguments);
    assert.equal(root.array, true);
    assert(!argumentRoots.has(root.id));
    argumentRoots.add(root.id);
    assert.equal(rawProperty(call.rawArguments, 'length'), args.length);
    assert.deepEqual(array(root.properties).map(row => record(row).key),
      [...args.map((_arg, key) => String(key)), 'length']);
    assert.deepEqual(call.receiver, nativeReceiver, 'Named Native callback receiver boundary');
    const event = encodedArray(owner.events[index]);
    assert.equal(event[0], call.name);
    assert.deepEqual(event.slice(1), args);
    assert.equal(rawProperty(owner.rawEvents[index], '0'), call.name);
    assert.equal(rawProperty(owner.rawEvents[index], 'length'), args.length + 1);
    if (focusNames.has(call.name)) {
      const focus = call.nativeFocus;
      assert(focus, 'Actual Native FocusEvent sidecar');
      assert.equal(focus.type, call.name);
      assert.equal(focus.ownerAlive, true);
      assert.equal(focus.isTrusted, true);
      assert.equal(focus.targetTag, 'INPUT');
      assert.equal(focus.targetId, 'preset-field');
      assert.equal(focus.targetConnected, true);
      assert.equal(focus.currentTargetTag, 'INPUT');
      assert.equal(focus.currentTargetMatchesTarget, true);
    }
    else assert.equal(call.nativeFocus, undefined);
  }
  const invocations = owner.callbackInvocations.filter(call => dateNames.has(call.name));
  assert.equal(owner.callbackDates.length, invocations.length);
  for (const [index, callback] of owner.callbackDates.entries()) {
    const call = invocations[index], args = encodedArray(call.arguments);
    assert.equal(callback.name, call.name);
    assert.equal(callback.actionIndex, call.actionIndex);
    nativeDateAliases(callback.value, owner);
    assert.deepEqual(callback.value.encoded, args[0]);
    if (callback.value.identity !== null)
      assert.equal(record(rawProperty(call.rawArguments, '0')).ref, callback.value.identity);
    const infoIndex = call.name === 'calendar' ? 2
      : ['panel', 'picker-value'].includes(call.name) ? 1 : null;
    assert.deepEqual(callback.info, infoIndex === null ? { $: 'undefined' } : args[infoIndex]);
    if (call.name === 'calendar') {
      assert.deepEqual(args[2], {
        $: 'object', properties: [{ key: 'source', value: 'date' }]
      }, 'Named Native calendar-info boundary, with no unknown info fields');
      assert.deepEqual(callback.ownInfo, [{
        key: 'source', enumerable: true, configurable: true, writable: true,
        kind: 'value', valueType: 'string'
      }]);
    }
    else if (call.name === 'picker-value') {
      assert.equal(args.length, 2, 'No one-argument picker-value compatibility waiver');
      assert.deepEqual(callback.ownInfo, rawRoot(callback.rawInfo).ownProperties);
      assert.deepEqual(
        array(record(callback.info).properties).map(row => record(row).key),
        ['source', 'mode']
      );
      assert.equal(record(rawProperty(call.rawArguments, '1')).ref, rawRoot(callback.rawInfo).id);
    }
  }
  for (const [index, value] of owner.calls.entries()) {
    const call = record(value);
    assert.equal(call.index, index);
    assert.equal(call.side, 'own');
    const args = encodedArray(call.argument);
    const timeValidation = call.kind === 'disabledTime' && args.length === 3;
    const supported: Record<string, number> = {
      disabledDate: 2, disabledTime: timeValidation ? 3 : 1, disabledHours: 0
    };
    assert(
      Object.hasOwn(supported, String(call.kind)),
      'Unknown Native producer: ' + String(call.kind)
    );
    assert.equal(
      call.actualArgumentCount,
      supported[String(call.kind)],
      'Measured strict Native producer arity: ' + call.kind
    );
    assert.equal(args.length, call.actualArgumentCount);
    assert.equal(rawProperty(call.rawArgument, 'length'), args.length);
    if (timeValidation) {
      assert.equal(args[1], 'start', 'Single field validation range');
      assert.deepEqual(args[2], {
        $: 'object', properties: [{ key: 'from', value: { $: 'undefined' } }]
      }, 'Exact validation context without extra fields');
      const argument = rawRoot(call.rawArgument);
      assert.deepEqual(array(argument.properties).map(row => record(row).key),
        ['0', '1', '2', 'length']);
      assert.equal(rawProperty(call.rawArgument, '1'), 'start');
      const infoRef = record(rawProperty(call.rawArgument, '2')).ref;
      const info = array(record(call.rawArgument).objects).map(record)
        .find(node => node.id === infoRef);
      assert(info, 'Actual validation info raw object');
      assert.equal(info.type, 'object');
      assert.equal(info.array, false);
      assert.equal(info.authoredRole, null);
      assert.deepEqual(info.ownProperties, [{
        key: 'from', enumerable: true, configurable: true, writable: true,
        kind: 'value', valueType: 'undefined'
      }]);
      assert.deepEqual(info.properties, [{ key: 'from', value: { $: 'undefined' } }]);
      const date = record(call.date);
      assert.deepEqual(date.encoded, args[0], 'Exact validation Date argument');
      assert.deepEqual(call.receiver, nativeReceiver, 'Natural validation props receiver');
      if (!owner.open && owner.callbackInvocations.length === 0 && owner.ownerActions.length === 0
        && call.actionIndex === -1) {
        assert.equal(
          date.identity,
          owner.value.identity,
          'Initial validation uses the public model Date'
        );
        assert.deepEqual(
          date.temporal,
          owner.value.temporal,
          'Initial validation keeps full hidden fields'
        );
      }
    }
    if (call.date) {
      const date = call.date as NativeDate;
      nativeDateAliases(date, owner);
      assert.equal(record(rawProperty(call.rawArgument, '0')).ref, date.identity);
    }
    const context = record(call.receiver);
    assert.equal(typeof context.isUndefined, 'boolean');
    assert.equal(typeof context.isNull, 'boolean');
    assert.equal(typeof context.type, 'string');
    assert.equal(context.isUndefined, context.type === 'undefined');
    if (context.isNull) assert.equal(context.type, 'object');
    if (owner.lifecycle.length)
      assert.deepEqual(context, nativeReceiver, 'Measured Native CSR producer receiver boundary');
  }
}
function inputHooks(owner: NativeOwner | SourceOwner, native: boolean, sample: Sample) {
  const prefix = sample.prefixCls ?? 'ant-picker';
  let nonFocus = 0, panelFocused = false;
  return owner.callbackInvocations.flatMap(call => {
    if (!focusNames.has(call.name)) {
      nonFocus++;
      return [];
    }
    if (native) {
      assert.equal(call.actualArgumentCount, 1);
      return [{ name: call.name, actionIndex: call.actionIndex, afterNonFocus: nonFocus }];
    }
    const args = encodedArray(call.arguments);
    assert.equal(call.actualArgumentCount, 2);
    assert.deepEqual(args[1], { $: 'object', properties: [] });
    const target = record(encodedProperty(args[0], 'target'));
    assert.equal(target.$, 'dom-node');
    const attributes = array(target.attributes) as Array<[string, string]>;
    if (target.nodeName === 'INPUT') {
      assert(attributes.some(([name, value]) => name === 'id' && value === 'preset-field'));
      return [{ name: call.name, actionIndex: call.actionIndex, afterNonFocus: nonFocus }];
    }
    assert.equal(
      target.nodeName,
      'DIV',
      'Only the measured Source composite panel hook is separate'
    );
    assert(attributes.some(([name, value]) => name === 'class' && value.split(' ').includes(prefix + '-panel-container')));
    assert(attributes.some(([name, value]) => name === 'tabindex' && value === '-1'));
    if (call.name === 'focus') {
      assert.equal(
        sample.actions[call.actionIndex]?.type,
        'preset-click',
        'Measured Source panel focus comes from a preset click'
      );
      assert.equal(panelFocused, false, 'No duplicate Source panel focus can disappear');
      panelFocused = true;
    }
    else {
      assert.equal(panelFocused, true, 'No unmatched Source panel blur can disappear');
      panelFocused = false;
    }
    return [];
  });
}
function compareOwnerActions(
  native: NativeOwner,
  source: SourceOwner,
  proof: DatePickerPresetTransitionProof,
  label: string
) {
  assert.equal(native.ownerActions.length, source.ownerActions.length);
  for (const [index, actual] of native.ownerActions.entries()) {
    const original = source.ownerActions[index];
    for (const key of ['actionIndex', 'kind', 'value', 'event'] as const)
      assert.deepEqual(actual[key], original[key], label + '/owner action/' + index + '/' + key);
    const before = record(original.before);
    for (const key of ['open', 'format', 'preview'] as const)
      assert.deepEqual(actual.before[key], before[key]);
    for (const key of ['value', 'pickerValue', 'minDate'] as const) {
      verifyDatePickerPresetTransitionDate(actual.before[key], before[key] as SourceDate, proof,
        label + '/owner action/' + index + '/' + key);
    }
    const mouse = actual.nativeMouse;
    assert.equal(
      mouse.actualArgumentCount,
      3,
      'Actual authored Native ownerAction(kind,value,event) arity'
    );
    assert.equal(mouse.actualArgumentCount, encodedArray(mouse.arguments).length);
    assert.deepEqual(encodedArray(mouse.arguments).slice(0, 2), [actual.kind, actual.value]);
    assert.equal(rawProperty(mouse.rawArguments, 'length'), mouse.actualArgumentCount);
    assert.equal(mouse.nativeEventWrapperPresent, false);
    assert.equal(mouse.targetTag, 'BUTTON');
    assert.equal(mouse.currentTargetTag, 'BUTTON');
    assert.equal(mouse.currentTargetMatchesTarget, true);
  }
}
export function verifyDatePickerPresetTransitionOwner(
  native: NativeOwner, source: SourceOwner, sample: Sample,
  proof: DatePickerPresetTransitionProof, label: string, compareFocus = true
) {
  validateNativeOwner(native);
  verifyDatePickerPresetTransitionsSourceOwner(source);
  for (const key of ['alive', 'open', 'format', 'preview', 'pickerOwner'] as const)
    assert.equal(native[key], source[key], label + '/' + key);
  assert.deepEqual(native.lifecycle, source.lifecycle, label + '/actual owner lifecycle');
  assert.deepEqual(native.authoredSample, source.authoredSample, label + '/authored sample');
  assert.deepEqual(native.authoredPresets, source.authoredPresets, label + '/authored presets');
  for (const name of authoredNames) {
    verifyDatePickerPresetTransitionDate(native.authoredDates[name], source.authoredDates[name], proof,
      label + '/authored/' + name);
  }
  for (const name of ['value', 'pickerValue', 'minDate'] as const)
    verifyDatePickerPresetTransitionDate(native[name], source[name], proof, label + '/' + name);
  const calls = native.callbackInvocations.filter(call => !focusNames.has(call.name));
  const originals = source.callbackInvocations.filter(call => !focusNames.has(call.name));
  assert.equal(calls.length, originals.length, label + '/complete nonfocus callback count');
  for (const [index, call] of calls.entries()) {
    const original = originals[index], args = encodedArray(call.arguments), expected = encodedArray(original.arguments);
    for (const key of ['name', 'actionIndex', 'actualArgumentCount'] as const)
      assert.equal(call[key], original[key], label + '/callback/' + index + '/' + key);
    assert.deepEqual(original.receiver, sourceReceiver);
    assert.deepEqual(call.receiver, nativeReceiver);
    if (call.name === 'calendar') {
      assert.deepEqual(expected[2], { $: 'object', properties: [] });
      assert.deepEqual(
        args.slice(0, 2),
        expected.slice(0, 2),
        label + '/calendar complete date/text payload'
      );
    }
    else assert.deepEqual(args, expected, label + '/callback complete payload/' + index);
  }
  assert.equal(native.callbackDates.length, source.callbackDates.length);
  for (const [index, callback] of native.callbackDates.entries()) {
    const original = source.callbackDates[index];
    assert.equal(callback.name, original.name);
    assert.equal(callback.actionIndex, original.actionIndex);
    assert.deepEqual(callback.text, original.text);
    verifyDatePickerPresetTransitionDate(
      callback.value,
      original.value,
      proof,
      label + '/callback date/' + index
    );
    if (callback.name !== 'calendar') {
      assert.deepEqual(callback.info, original.info, label + '/callback info/' + index);
      assert.deepEqual(
        callback.ownInfo,
        original.ownInfo,
        label + '/callback info descriptors/' + index
      );
    }
  }
  compareOwnerActions(native, source, proof, label);
  if (compareFocus) {
    assert.deepEqual(inputHooks(native, true, sample),
      inputHooks(source, false, sample), label + '/actual input hooks and position');
  }
}
function visibleElements(point: NativePoint | SourcePoint): AnyNode[] {
  return point.popups.filter(popup => popup.visible).flatMap(popup => popup.allElements);
}
function headers(point: NativePoint | SourcePoint, prefix: string) {
  const elements = visibleElements(point);
  const views = elements.filter(node => hasClass(node, prefix + '-header-view'));
  assert.equal(views.length, point.calendarHeaders.length);
  return views.map((node, index) => {
    assert.equal(node.text, point.calendarHeaders[index].text);
    assert.equal(node.html, point.calendarHeaders[index].html);
    const children = (node.children ?? []).filter(child => child.type === 1)
      .map(child => elements.find(element => element.identity === child.identity));
    assert(children.every(Boolean));
    const buttons = children.filter(child => child!.tag === 'BUTTON') as AnyNode[];
    if (buttons.length) {
      assert.equal(children.length, 2);
      assert.equal(buttons.length, 2);
      assert(hasClass(buttons[0], prefix + '-month-btn'));
      assert(hasClass(buttons[1], prefix + '-year-btn'));
      return { kind: 'calendar', month: buttons[0].text, year: buttons[1].text };
    }
    assert.equal(children.length, 0, 'Only the measured plain time header is separate');
    return { kind: 'time', text: node.text };
  });
}
function calendarCells(point: NativePoint | SourcePoint, prefix: string) {
  return point.cells.map(node => ({
    title: attr(node, 'title'), selected: hasClass(node, prefix + '-cell-selected'),
    hover: hasClass(node, prefix + '-cell-hover'), disabled: hasClass(
      node,
      prefix + '-cell-disabled'
    ),
    inView: hasClass(node, prefix + '-cell-in-view'), today: hasClass(node, prefix + '-cell-today')
  }));
}
function timeRows(point: NativePoint | SourcePoint, prefix: string, native: boolean) {
  const elements = visibleElements(point);
  const columns = elements.filter(node => node.tag === 'UL' && hasClass(
    node,
    prefix + '-time-panel-column'
  ));
  assert.equal(columns.length, point.timeColumns.length);
  return columns.map((column, index) => {
    const actual = point.timeColumns[index];
    const type = attr(column, 'data-type') ?? (native ? attr(column, 'aria-label') : null);
    assert(type && ['hour', 'minute', 'second', 'millisecond', 'meridiem'].includes(type));
    assert.equal(actual.type, attr(column, 'data-type'), 'Actual reader column attribute retained');
    const cells = (column.children ?? []).filter(child => child.type === 1)
      .map(child => elements.find(node => node.identity === child.identity));
    assert(cells.every(Boolean));
    assert.equal(cells.length, actual.cells.length);
    return {
      type, scrollTop: actual.scrollTop, scrollHeight: actual.scrollHeight, clientHeight: actual.clientHeight,
      cells: cells.map((candidate, row) => {
      const cell = candidate!;
      assert.equal(cell.tag, 'LI');
      const observed = actual.cells[row];
      assert.deepEqual(observed.attributes, cell.attributes);
      assert.equal(observed.text, cell.text);
      assert.equal(observed.value, attr(cell, 'data-value'));
      let value = observed.value;
      if (native && value === null) {
        const buttons = elements.filter(node => node.parentIdentity === cell.identity && node.tag === 'BUTTON');
        assert.equal(buttons.length, 1);
        const button = buttons[0];
        if (type === 'meridiem') {
          assert(button.text === 'AM' || button.text === 'PM');
          value = button.text.toLowerCase();
        }
        else {
          const label = attr(button, 'aria-label');
          assert(label);
          const match = new RegExp('^' + type + ' ([0-9]+)$').exec(label);
          assert(match);
          value = String(Number(match[1]));
        }
      }
      assert(value !== null);
      assert.equal(observed.selected, hasClass(cell, prefix + '-time-panel-cell-selected'));
      assert.equal(observed.disabled, hasClass(cell, prefix + '-time-panel-cell-disabled'));
      return {
        value,
        text: observed.text,
        selected: observed.selected,
        disabled: observed.disabled
      };
    }) };
  });
}
function physicalFocus(point: NativePoint | SourcePoint, prefix: string) {
  const node = point.activeElement;
  assert(node && node.connected);
  if (node.tag === 'BODY') {
    return { kind: 'body' };
  }
  if (node.tag === 'INPUT') {
    assert.equal(attr(node, 'id'), 'preset-field');
    return { kind: 'input' };
  }
  if (node.tag === 'DIV') {
    assert(hasClass(node, prefix + '-panel-container'));
    assert.equal(attr(node, 'tabindex'), '-1');
    return { kind: 'panel' };
  }
  assert.equal(node.tag, 'BUTTON');
  assert(attr(node, 'data-transition-control') !== null || attr(node, 'data-picker-outside') !== null);
  return {
    kind: 'authored-button',
    transition: attr(node, 'data-transition-control'),
    value: attr(node, 'data-transition-value')
  };
}
export function verifyDatePickerPresetTransitionCaret(
  native: Pick<NativePoint, 'owner' | 'input' | 'activeElement'>,
  source: Pick<SourcePoint, 'owner' | 'input' | 'activeElement'>, label: string
) {
  const actual = native.input, original = source.input;
  assert(actual && original && actual.selection && original.selection);
  assert.equal(typeof actual.value, 'string');
  assert.equal(typeof original.value, 'string');
  assert.deepEqual(
    actual.selection.slice(0, 2),
    original.selection.slice(0, 2),
    label + '/caret endpoints'
  );
  const fresh = [native, source].every(point => {
    const input = point.input!;
    return point.owner.alive && !point.owner.open && !input.focused
      && point.activeElement?.tag === 'BODY'
      && point.owner.callbackInvocations.length === 0 && point.owner.ownerActions.length === 0
      && point.owner.events.length === 0 && point.owner.rawEvents.length === 0
      && point.owner.callbackDates.length === 0
      && input.selection?.[0] === (input.value as string).length
      && input.selection[1] === (input.value as string).length;
  });
  if (fresh) {
    assert.equal(actual.selection[2], 'none', label + '/measured Native initial HTML construction');
    assert.equal(
      original.selection[2],
      'forward',
      label + '/measured Source initial HTML construction'
    );
  }
  else assert.deepEqual(actual.selection, original.selection, label + '/complete actual caret');
}
export function verifyDatePickerPresetTransitionPoint(
  native: NativePoint, source: SourcePoint, sample: Sample,
  proof: DatePickerPresetTransitionProof, label: string
) {
  verifyDatePickerPresetTransitionsSourcePoint(source);
  verifyDatePickerPresetTransitionOwner(native.owner, source.owner, sample, proof, label);
  assert(native.root?.connected && native.input?.connected);
  assert(native.sameRoot && native.sameInput && native.publicRef.controlPresent);
  assert.equal(native.publicRef.nativeElementIdentity, native.root.identity);
  for (const [field, value] of [['nativeRoot', native.root.identity], ['nativeInput', native.input.identity]] as const) {
    if (proof[field] === undefined) proof[field] = value;
    assert.equal(value, proof[field], label + '/stable Native DOM ' + field);
  }
  const refs = native.publicRefDetails;
  assert(
    refs.sameControl && refs.sameFocus && refs.sameBlur,
    label + '/stable actual Native handles'
  );
  for (const [field, value] of [
    ['nativeControl', refs.controlIdentity], ['nativeFocus', refs.focusIdentity], ['nativeBlur', refs.blurIdentity]
  ] as const) {
    assert(value !== null && Number.isSafeInteger(value) && value > 0);
    if (proof[field] === undefined) proof[field] = value;
    assert.equal(value, proof[field], label + '/stable Native ' + field);
  }
  assert(refs.controlOwnKeys.includes('focus') && refs.controlOwnKeys.includes('blur'));
  proof.nativeControlOwnKeys ??= refs.controlOwnKeys;
  assert.deepEqual(refs.controlOwnKeys, proof.nativeControlOwnKeys);
  assert.deepEqual(native.environment, { timezone: 'UTC' });
  assert.deepEqual(native.browserOwnedResourceCounters, counters);
  assert(Array.isArray(native.resourceTiming));
  assert.equal(native.input.value, source.input!.value, label + '/displayed input');
  assert.equal(native.input.focused, source.input!.focused, label + '/actual input focus');
  verifyDatePickerPresetTransitionCaret(native, source, label);
  assert.equal(attr(native.input, 'id'), 'preset-field');
  assert.equal(attr(native.input, 'name'), 'retained-date');
  const invalid = attr(native.input, 'aria-invalid'), sourceInvalid = attr(
    source.input,
    'aria-invalid'
  );
  assert(invalid === null || invalid === 'true');
  assert(sourceInvalid === 'false' || sourceInvalid === 'true');
  assert.equal(invalid === 'true', sourceInvalid === 'true');
  assert(native.form?.connected && source.form?.connected);
  assert.deepEqual(native.form.attributes, source.form.attributes);
  assert.deepEqual(native.form.entries, [['retained-date', native.input.value]]);
  assert.deepEqual(native.form.entries, source.form.entries, label + '/actual FormData');
  const prefix = sample.prefixCls ?? 'ant-picker';
  const nativeParent = native.rootElements.find(node => node.identity === native.input!.parentIdentity);
  const sourceParent = source.rootElements.find(node => node.identity === source.input!.parentIdentity);
  assert(nativeParent && sourceParent);
  assert.equal(hasClass(nativeParent, prefix + '-input-placeholder'),
    hasClass(sourceParent, prefix + '-input-placeholder'), label + '/preview presentation');
  assert.equal(Boolean(native.clear), Boolean(source.clear));
  assert.deepEqual(
    physicalFocus(native, prefix),
    physicalFocus(source, prefix),
    label + '/physical focus target'
  );
  if (source.owner.open) {
    assert.equal(native.popups.filter(popup => popup.visible).length, 1);
    assert.equal(source.popups.filter(popup => popup.visible).length, 1);
    assert.equal(native.cells.length, 42);
    assert.equal(source.cells.length, 42);
    assert.deepEqual(calendarCells(native, prefix), calendarCells(source, prefix),
      label + '/complete selected/hover/disabled calendar state');
    assert.deepEqual(
      headers(native, prefix),
      headers(source, prefix),
      label + '/actual header leaves'
    );
    assert.deepEqual(timeRows(native, prefix, true), timeRows(source, prefix, false),
      label + '/shown time rows, selected and disabled state');
    assert.deepEqual(native.presets.map(node => node.text), source.presets.map(node => node.text));
  }
  else {
    assert.equal(native.popups.length, 0);
    assert.equal(native.cells.length, 0);
    assert.equal(native.calendarHeaders.length, 0);
    assert.equal(native.timeColumns.length, 0);
    assert(
      source.popups.every(popup => !popup.visible),
      'Source hidden retained DOM is not current Native DOM'
    );
  }
}
export function verifyDatePickerPresetTransitionActionEvidence(native: unknown, source: unknown) {
  // Authored button click evidence is a real DOM observation, not an afterCall settled-state claim.
  assert.deepEqual(native, source);
}
function removed(value: NativeCleanup | SourceCleanup) {
  assert.equal(value.owner.alive, false);
  assert.deepEqual(value.refs, { control: true, root: true, owner: true });
  assert.equal(value.ownerCount, 0);
  assert.equal(value.popupCount, 0);
  assert(value.retained.some(node => node.owned));
  assert(value.retained.filter(node => node.owned).every(node => !node.connected));
  assert.deepEqual(value.browserOwnedResourceCounters, counters);
}
export function verifyDatePickerPresetTransitionRemoval(
  nativeBefore: NativePoint, native: NativeCleanup, nativeLate: NativeCleanup,
  sourceBefore: SourcePoint, source: SourceCleanup, sourceLate: SourceCleanup,
  sample: Sample, proof: DatePickerPresetTransitionProof, label: string
) {
  verifyDatePickerPresetTransitionPoint(
    nativeBefore,
    sourceBefore,
    sample,
    proof,
    label + '/before removal'
  );
  removed(native);
  removed(nativeLate);
  removed(source);
  removed(sourceLate);
  assert.deepEqual(nativeLate, native, label + '/complete actual Native late silence');
  assert.deepEqual(sourceLate, source, label + '/complete actual Source late silence');
  verifyDatePickerPresetTransitionOwner(
    native.owner,
    source.owner,
    sample,
    proof,
    label + '/cleanup',
    false
  );
  verifyDatePickerPresetTransitionOwner(
    nativeLate.owner,
    sourceLate.owner,
    sample,
    proof,
    label + '/late',
    false
  );
  const expectedHooks = inputHooks(source.owner, false, sample);
  const actualHooks = inputHooks(native.owner, true, sample);
  if (actualHooks.length === expectedHooks.length) {
    assert.deepEqual(actualHooks, expectedHooks);
    return;
  }
  assert.equal(
    actualHooks.length,
    expectedHooks.length + 1,
    'Only one actual connected input removal blur can differ'
  );
  assert(nativeBefore.input?.focused);
  assert.equal(nativeBefore.activeElement?.identity, nativeBefore.input.identity);
  assert.equal(nativeBefore.activeElement?.tag, 'INPUT');
  assert.deepEqual(inputHooks(nativeBefore.owner, true, sample), expectedHooks);
  assert.deepEqual(inputHooks(sourceBefore.owner, false, sample), expectedHooks);
  const before = nativeBefore.owner.callbackInvocations, after = native.owner.callbackInvocations;
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.slice(0, -1), before, 'Complete callback prefix before removal');
  const extra = after.at(-1) as NativeInvocation;
  assert.equal(extra.name, 'blur');
  assert.equal(extra.actionIndex, sample.actions.length - 1);
  assert.equal(extra.actualArgumentCount, 1);
  assert.deepEqual(extra.nativeFocus, {
    type: 'blur', isTrusted: true, ownerAlive: true,
    targetTag: 'INPUT', targetId: 'preset-field', targetConnected: true,
    currentTargetTag: 'INPUT', currentTargetMatchesTarget: true, relatedTargetTag: null
  }, 'Only the measured real connected DOM removal blur boundary');
  assert.deepEqual(actualHooks.slice(0, -1), expectedHooks);
}

export interface DatePickerPresetTransitionSSRRendered {
  head: string; body: string; state: NativeOwner;
  refs: Record<'control' | 'root' | 'owner', boolean>;
  domFree: boolean;
}
function oneSSRInput(body: string) {
  const matches = [...body.matchAll(/<input\b[^>]*>/g)];
  assert.equal(matches.length, 1, 'One real closed public DatePicker SSR input');
  const html = matches[0][0];
  const attributes = [...html.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(match => [match[1], match[2] ?? match[3]] as const);
  const attribute = (name: string) => {
    // The one observed spelling boundary: React SSR writes autoComplete.
    // No other attribute name/value or raw HTML is changed or normalized.
    const spellings = name === 'autocomplete' ? ['autocomplete', 'autoComplete'] : [name];
    const found = attributes.filter(([key]) => spellings.includes(key));
    assert(found.length <= 1, 'No duplicate public HTML attribute: ' + name);
    return found[0]?.[1];
  };
  return { html, attributes, attribute };
}
export function verifyDatePickerPresetTransitionClosedSSR(
  native: DatePickerPresetTransitionSSRRendered, source: SourceSSR, sample: Sample,
  proof: DatePickerPresetTransitionProof, label: string
) {
  assert.equal(typeof native.head, 'string');
  assert.equal(typeof native.body, 'string');
  assert.equal(native.domFree, true);
  assert.equal(source.domFree, true);
  assert.equal(source.fatal, null);
  assert.deepEqual(native.refs, { control: true, root: true, owner: true });
  assert.deepEqual(source.refs, { control: true, root: true, owner: true });
  assert.deepEqual(
    source.resources,
    { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 }
  );
  const actual = oneSSRInput(native.body), original = oneSSRInput(source.rawHtml);
  const fields = ['id', 'value', 'name', 'placeholder', 'autocomplete'] as const;
  for (const name of fields) {
    const expected = original.attribute(name);
    assert(expected !== undefined);
    assert.equal(actual.attribute(name), expected, label + '/real closed SSR input/' + name);
  }
  assert.equal(actual.attribute('id'), 'preset-field');
  assert.equal(actual.attribute('name'), 'retained-date');
  assert.equal(actual.attribute('aria-expanded'), 'false');
  assert(!actual.attributes.some(([name]) => /^(?:presets|previewvalue)$/i.test(name)));
  assert(!/<div\b[^>]*\bdata-picker-popup(?:[\s=>])/.test(native.body));
  assert(!/<div\b[^>]*\bdata-picker-presets(?:[\s=>])/.test(native.body));
  assert.equal(native.state.alive, false);
  assert.equal(native.state.open, false);
  for (const name of ['events', 'rawEvents', 'callbackInvocations', 'callbackDates', 'ownerActions', 'lifecycle'] as const) {
    assert.deepEqual(source.state[name], [], label + '/actual Source closed SSR/' + name);
    assert.deepEqual(native.state[name], [], label + '/actual Native closed SSR/' + name);
  }
  verifyDatePickerPresetTransitionOwner(native.state, source.state, sample, proof, label, false);
  return {
    publicInputFieldsCompared: fields, fullDOMParityClaimed: false, portalDOMParityClaimed: false,
    sourcePureProducerCalls: source.state.calls.length, nativePureProducerCalls: native.state.calls.length,
    pureProducerMultiplicityParityClaimed: false, sourceCallsSynthesized: false
  };
}

export interface DatePickerPresetTransitionDisposalTrace {
  operations: Array<{
    operation: 'beforeUnmount-read' | 'dispose-start' | 'dispose-finished' | 'cleanup-read' | 'late-1000-read';
    alive?: boolean;
  }>;
}
export function verifyDatePickerPresetTransitionDisposalTrace(trace: DatePickerPresetTransitionDisposalTrace) {
  assert.deepEqual(trace.operations.map(row => row.operation), [
    'beforeUnmount-read', 'dispose-start', 'dispose-finished', 'cleanup-read', 'late-1000-read'
  ]);
  assert.equal(trace.operations[0].alive, true);
  assert.equal(trace.operations[3].alive, false);
  assert.equal(trace.operations[4].alive, false);
}
export function verifyDatePickerPresetTransitionDisposal(
  native: {
    beforeUnmount: NativePoint;
    cleanup: NativeCleanup;
    late: NativeCleanup;
    trace: DatePickerPresetTransitionDisposalTrace
  },
  source: { beforeUnmount: SourcePoint; cleanup: SourceCleanup; late: SourceCleanup },
  sample: Sample, proof: DatePickerPresetTransitionProof, label: string
) {
  verifyDatePickerPresetTransitionDisposalTrace(native.trace);
  verifyDatePickerPresetTransitionRemoval(
    native.beforeUnmount, native.cleanup, native.late,
    source.beforeUnmount, source.cleanup, source.late, sample, proof, label
  );
}
