import assert from 'node:assert/strict';

const attr = (node, name) => node.attributes.find(row => row[0] === name)?.[1] ?? null;
const props = value => Object.fromEntries(value.properties.map(row => [row.key, row.value]));
const nonFocus = calls => calls.filter(call => !['focus', 'blur'].includes(call.name));
export function createTimeScrollProof() {
  return {
    root: null,
    input: null,
    points: 0,
    previousVisible: null,
    boundaries: [],
    transitions: []
  };
}
function sameTemporal(actual, source) {
  assert.deepEqual(Object.keys(actual), Object.keys(source));
  assert.equal(actual.utcOffset === source.utcOffset, true, 'Numeric UTC offset, including -0');
  for (const key of Object.keys(source).filter(key => key !== 'utcOffset')) {
    assert.deepEqual(actual[key], source[key], 'Actual temporal field ' + key);
  }
}
function sameDate(actual, source) {
  sameTemporal(actual.temporal, source.temporal);
  assert.deepEqual(actual.sameAsAuthored, source.sameAsAuthored);
  assert.deepEqual(actual.encoded, source.encoded);
  const a = actual.raw.objects.find(node => node.id === actual.raw.root.ref);
  const s = source.raw.objects.find(node => node.id === source.raw.root.ref);
  const extras = a.ownProperties.filter(row => !s.ownProperties.some(other => other.key === row.key));
  assert(extras.every(row => row.key === '$u' && row.valueType === 'undefined'));
  if (extras.length) assert.deepEqual(a.properties.find(row => row.key === '$u').value,
    { $: 'undefined' }, 'Actual UTC plugin own field stays undefined');
  assert(s.ownProperties.every(row => a.ownProperties.some(other => other.key === row.key)));
}
function verifyCallbacks(actual, source) {
  const a = nonFocus(actual.owner.callbacks);
  const s = nonFocus(source.owner.callbacks);
  assert.equal(a.length, s.length, 'Actual non-focus callback ledger length');
  for (const [index, expected] of s.entries()) {
    const call = a[index];
    assert.equal(call.name, expected.name);
    assert.equal(call.actionIndex, expected.actionIndex);
    assert.equal(call.actualArgumentCount, expected.actualArgumentCount);
    assert.deepEqual(call.encodedArguments, expected.encodedArguments);
    assert.equal(call.dates.length, expected.dates.length);
    for (const [dateIndex, expectedDate] of expected.dates.entries()) {
      assert.equal(call.dates[dateIndex].argument, expectedDate.argument);
      sameDate(call.dates[dateIndex].value, expectedDate.value);
    }
    if (call.name === 'picker-value') {
      assert.equal(call.actualArgumentCount, 2);
      assert.equal(call.dates[0].value.identity, actual.owner.value.identity);
      assert.equal(call.dates[0].value.sameAsAuthored.value, true);
      assert.equal(call.rawArguments.objects.find(node => node.id === call.rawArguments.root.ref)
        .properties.find(row => row.key === '0').value.ref, actual.owner.value.identity);
    }
  }
}
function verifyNativeFocus(call, inputID) {
  assert.equal(call.actualArgumentCount, 1);
  assert.equal(call.publicProp, call.name === 'focus' ? 'onfocus' : 'onblur');
  const focus = call.nativeFocus;
  assert(focus, 'Actual FocusEvent instanceof sidecar must exist');
  assert.equal(focus.targetIdentity, inputID);
  assert.equal(focus.currentTargetIdentity, inputID);
  assert.equal(focus.targetTag, 'INPUT');
  assert.equal(focus.currentTargetTag, 'INPUT');
  assert.equal(focus.currentTargetMatchesTarget, true);
  assert.equal(focus.targetId, 'scroll-picker-input');
}
export function verifyTimeScrollPoint(actual, source, sample, proof, label) {
  assert.equal(actual.owner.alive, true);
  assert.equal(actual.owner.open, source.owner.open);
  assert.equal(actual.owner.getterMode, source.owner.getterMode);
  for (const key of ['value', 'pickerValue', 'defaultOpenValue']) {
    sameDate(actual.owner[key], source.owner[key]);
  }
  const actualProps = props(actual.owner.publicProps.encoded);
  const sourceProps = props(source.owner.publicProps.encoded);
  for (const key of ['id', 'value', 'pickerValue', 'open', 'format', 'showTime', 'showNow',
    'onChange', 'onCalendarChange', 'onPickerValueChange', 'onPanelChange', 'onOpenChange',
    'onOk', 'getPopupContainer']) {
    assert.deepEqual(actualProps[key], sourceProps[key], 'Common public prop ' + key);
  }
  proof.root ??= actual.root.identity;
  proof.input ??= actual.input.identity;
  assert.equal(actual.root.identity, proof.root);
  assert.equal(actual.input.identity, proof.input);
  assert.equal(actual.refs.nativeElement, actual.root.identity);
  assert(actual.refs.control.own.some(row => row.key === 'focus'));
  assert(actual.refs.control.own.some(row => row.key === 'blur'));
  assert.equal(actual.input.value, source.input.value);
  assert.equal(actual.input.focused, source.input.focused);
  assert.equal(actual.focus.tag, source.focus.tag);
  if (source.focus.identity === source.input.identity) {
    assert.equal(actual.focus.identity, actual.input.identity);
  }
  verifyCallbacks(actual, source);
  for (const call of actual.owner.callbacks.filter(call => ['focus', 'blur'].includes(call.name))) {
    verifyNativeFocus(call, proof.input);
  }
  for (const call of actual.owner.getters) {
    assert.equal(call.actualArgumentCount, 1);
    assert.equal(call.triggerIdentity, proof.root);
    assert.equal(call.targetIdentity, call.name === 'new-callback-different-target-B'
      ? actual.refs.targetB : actual.refs.targetA);
  }
  const sourceVisible = source.popups.filter(popup => popup.visible);
  const nativeVisible = actual.popups.filter(popup => popup.visible);
  if (sourceVisible.length) {
    const sourceColumns = sourceVisible.flatMap(popup => popup.columns);
    const nativeColumns = nativeVisible.flatMap(popup => popup.columns);
    assert.deepEqual(nativeColumns.map(column => column.type).sort(),
      sourceColumns.map(column => column.type).sort());
    for (const expected of sourceColumns) {
      const column = nativeColumns.find(value => value.type === expected.type);
      assert.equal(column.surface.scrollTop === expected.surface.scrollTop, true,
        label + ':' + column.type + ' visible scroll');
      assert.equal(column.surface.clientHeight, expected.surface.clientHeight);
      assert.equal(column.rows.length, expected.rows.length);
      for (const [index, row] of column.rows.entries()) {
        const expectedRow = expected.rows[index];
        assert.equal(row.surface.text, expectedRow.surface.text);
        assert.equal(row.selectedClass, expectedRow.selectedClass);
        assert.equal(row.disabledClass, expectedRow.disabledClass);
        assert.equal(row.offsetFromFirstRow, expectedRow.offsetFromFirstRow);
        assert.equal(row.surface.box.height, expectedRow.surface.box.height);
        assert.equal(row.button.tag, 'BUTTON');
        assert.equal(attr(row.button, 'aria-pressed'), String(expectedRow.selectedClass));
        if (column.type !== 'meridiem') {
          assert.equal(
            attr(row.button, 'aria-label'),
            column.type + ' ' + expectedRow.valueAttribute
          );
        }
      }
    }
    if (proof.previousVisible) {
      for (const expected of sourceColumns) {
        const previous = proof.previousVisible.find(row => row.type === expected.type);
        const column = nativeColumns.find(row => row.type === expected.type);
        assert(previous, 'The consecutive visible unit was previously observed');
        const sourceRetained = previous.source === expected.surface.identity;
        assert.equal(previous.native === column.surface.identity, sourceRetained,
          label + ':' + column.type + ' consecutive visible node identity');
        if (!sourceRetained) {
          assert(actual.retained.some(node => node.identity === previous.native && !node.connected),
            'The replaced actual Native column is disconnected');
        }
      }
    }
    proof.previousVisible = sourceColumns.map(expected => ({ type: expected.type,
      source: expected.surface.identity,
      native: nativeColumns.find(column => column.type === expected.type).surface.identity }));
    if (sample.portal) {
      const target = actual.owner.getterMode === 'different-target-new-callback' ? 'B' : 'A';
      assert(nativeVisible.every(popup => popup.ancestors.some(node =>
        attr(node, 'data-scroll-target') === target)));
    }
  }
  else {
    proof.previousVisible = null;
    assert.equal(nativeVisible.length, 0);
  }
  proof.boundaries.push({ label, sourceHidden: source.popups.map(popup => ({
    visible: popup.visible, columns: popup.columns.map(column => ({ type: column.type,
      scrollTop: column.surface.scrollTop, height: column.surface.box.height })) })),
    nativeHiddenOrAbsent: actual.popups.map(popup => ({ visible: popup.visible,
      columns: popup.columns.map(column => ({ type: column.type,
        scrollTop: column.surface.scrollTop, height: column.surface.box.height })) })),
    focusAPIs: { native: actual.owner.callbacks.filter(call => ['focus', 'blur'].includes(call.name))
      .map(call => ({ publicProp: call.publicProp, arity: call.actualArgumentCount })),
      sourceReact: source.owner.callbacks.filter(call => ['focus', 'blur'].includes(call.name))
        .map(call => ({ name: call.name, arity: call.actualArgumentCount })) },
    getters: { sourceActualCalls: source.owner.getters.length,
      nativeActualCalls: actual.owner.getters.length },
    receivers: { source: source.owner.callbacks.map(call => call.receiver),
      native: actual.owner.callbacks.map(call => call.receiver) },
    constructors: 'Dayjs public fields/aliases compared; Native own$u:undefined is separate. Exact JS constructor names were not captured and are not asserted equal.',
    refs: { source: source.refs.control?.own, native: actual.refs.control?.own },
    caret: { source: [source.input.selectionStart, source.input.selectionEnd, source.input.selectionDirection],
      native: [actual.input.selectionStart, actual.input.selectionEnd, actual.input.selectionDirection] } });
  proof.transitions.push({ label,
    source: sourceVisible.map(popup => ({ popup: popup.surface.identity,
      columns: popup.columns.map(column => [column.type, column.surface.identity]) })),
    native: nativeVisible.map(popup => ({ popup: popup.surface.identity,
      columns: popup.columns.map(column => [column.type, column.surface.identity]) })) });
  proof.points++;
}
export function verifyTimeScrollActionEvidence(actual, action) {
  if (action.type === 'wheel-to-top') {
    assert.equal(actual.observed.length, 1);
    assert.equal(actual.observed[0].isTrusted, true);
    assert.equal(actual.observed[0].deltaY, action.deltaY);
  }
  else if (action.type.startsWith('owner-')) {
    assert.equal(actual.click.type, 'click');
    assert.equal(actual.click.isTrusted, false);
    assert.equal(actual.click.targetMatches, true);
    assert.equal(actual.click.currentTargetMatches, true);
    assert.equal(actual.physicalFocusIdentityPreserved, true);
  }
}
export function verifyTimeScrollRemovalInterval(
  beforeUnmount, cleanup, late, sourceBefore, sourceCleanup, sourceLate
) {
  assert.equal(beforeUnmount.input.focused, true);
  assert.equal(beforeUnmount.focus.identity, beforeUnmount.input.identity);
  assert.deepEqual(cleanup.owner.callbacks.slice(0, beforeUnmount.owner.callbacks.length),
    beforeUnmount.owner.callbacks);
  assert.equal(cleanup.owner.callbacks.length, beforeUnmount.owner.callbacks.length + 1);
  const blur = cleanup.owner.callbacks.at(-1);
  assert.equal(blur.name, 'blur');
  assert.equal(blur.index, beforeUnmount.owner.callbacks.length);
  assert.equal(blur.actionIndex, beforeUnmount.owner.actionIndex);
  verifyNativeFocus(blur, beforeUnmount.input.identity);
  assert.equal(blur.nativeFocus.type, 'blur');
  assert.equal(blur.nativeFocus.isTrusted, true);
  assert.equal(blur.nativeFocus.ownerAlive, true);
  assert.equal(blur.nativeFocus.targetConnected, true);
  assert.equal(blur.nativeFocus.relatedTargetIsNull, true);
  assert.equal(blur.nativeFocus.relatedTargetTag, null);
  assert.deepEqual(late.owner.callbacks, cleanup.owner.callbacks);
  assert.deepEqual(sourceCleanup.owner.callbacks, sourceBefore.owner.callbacks);
  assert.deepEqual(sourceLate.owner.callbacks, sourceCleanup.owner.callbacks);
  for (const point of [cleanup, late]) {
    assert.equal(point.owner.alive, false);
    assert(Object.values(point.refs).every(value => value === null));
    assert.equal(point.popups.length, 0);
    assert.equal(point.retained.filter(node => node.connected).length, 0);
  }
}

export function verifyTimeScrollDisposal(disposal, sourceBefore, sourceCleanup, sourceLate) {
  assert.deepEqual(disposal.trace, ['beforeUnmount-read', 'dispose-start', 'dispose-finished',
    'cleanup-read', 'late-1000-read']);
  verifyTimeScrollRemovalInterval(disposal.beforeUnmount, disposal.cleanup, disposal.late,
    sourceBefore, sourceCleanup, sourceLate);
}
