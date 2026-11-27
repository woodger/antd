<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, enUS, type DatePickerProps } from '@woodger/antd';
  import { createDatePickerPresetsRecorder } from '../date-picker-presets-recorder.mjs';
  import { datePickerPresetGeometry } from '../date-picker-preset-transitions-cases.mjs';
  import type {
    DatePickerPresetTransitionSample, DatePickerPresetTransitionCapture,
    DatePickerPresetTransitionControl, DatePickerPresetTransitionDate,
    DatePickerPresetTransitionCallback, DatePickerPresetTransitionDateCallback,
    DatePickerPresetTransitionOwner, DatePickerPresetTransitionOwnerAction,
    DatePickerPresetTransitionOwnerControl
  } from '../date-picker-preset-transitions-native-types';

  let { sample, capture }: {
    sample: DatePickerPresetTransitionSample;
    capture?: DatePickerPresetTransitionCapture;
  } = $props();
  const initial = untrack(() => sample);
  const recorder = createDatePickerPresetsRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const callbackInvocations: DatePickerPresetTransitionCallback[] = [];
  const callbackDates: DatePickerPresetTransitionDateCallback[] = [];
  const ownerActions: DatePickerPresetTransitionOwnerAction[] = [];
  const lifecycle: Array<{ phase: 'mount' | 'unmount' }> = [];
  let control = $state<DatePickerPresetTransitionControl>();
  let root = $state<HTMLDivElement>(), owner = $state<HTMLElement>();
  let alive = false, actionIndex = -1;

  const initialValue = initial.initialValue == null ? null : dayjs(initial.initialValue);
  const defaultPickerValue = initial.defaultPickerValue === undefined ? undefined : dayjs(initial.defaultPickerValue);
  const initialPickerValue = initial.initialPickerValue === undefined ? undefined : dayjs(initial.initialPickerValue);
  const initialMinDate = initial.minDate === undefined ? undefined : dayjs(initial.minDate);
  const updatedMinDate = initial.updatedMinDate === undefined ? undefined : dayjs(initial.updatedMinDate);
  const maxDate = initial.maxDate === undefined ? undefined : dayjs(initial.maxDate);
  const presetValue = initial.preset === undefined ? undefined : dayjs(initial.preset.value);
  const presets = initial.preset === undefined ? undefined : [{
    label: initial.preset.label,
    value: presetValue!
  }];
  const authoredDates = {
    initialValue,
    defaultPickerValue,
    initialPickerValue,
    initialMinDate,
    updatedMinDate,
    maxDate,
    presetValue
  };
  for (const [role, date] of Object.entries(authoredDates)) {
    if (date != null) recorder.register(date, { authoredDate: role });
  }

  let value = $state.raw<Dayjs | null>(initialValue);
  let open = $state(false), format = $state(initial.format);
  let preview = $state<DatePickerPresetTransitionSample['preview']>(initial.preview);
  let pickerValue = $state.raw<Dayjs | undefined>(initialPickerValue);
  let minDate = $state.raw<Dayjs | undefined>(initialMinDate);

  const temporal = (date: Dayjs | null | undefined) => date == null ? null : {
    isDayjs: dayjs.isDayjs(date), valid: date.isValid(), epoch: date.valueOf(),
    iso: date.isValid() ? date.toISOString() : null, utcOffset: date.utcOffset(),
    fields: [date.year(), date.month(), date.date(), date.hour(), date.minute(), date.second(), date.millisecond()]
  };
  const snapshot = (date: Dayjs | null | undefined): DatePickerPresetTransitionDate => ({
    encoded: recorder.encode(date), raw: recorder.raw(date), temporal: temporal(date),
    identity: date == null ? null : recorder.identity(date),
    sameAsAuthoredDates: Object.fromEntries(Object.entries(authoredDates).map(([name, authored]) => [name, authored === date]))
  });
  const receiver = (context: unknown) => ({
    isUndefined: context === undefined, isNull: context === null, type: typeof context
  });
  const handler = <Value,>(name: string, callback: Value): Value =>
    recorder.register(callback, { callback: 'picker-preset-transitions-' + name });
  const event = (name: string, args: unknown[], context: unknown) => {
    events.push(recorder.encode([name, ...args]));
    rawEvents.push(recorder.raw([name, ...args]));
    const focus = typeof FocusEvent !== 'undefined' && args[0] instanceof FocusEvent ? args[0] : null;
    callbackInvocations.push({
      name, actionIndex, actualArgumentCount: args.length,
      arguments: recorder.encode(args), rawArguments: recorder.raw(args), receiver: receiver(context),
      ...(focus ? { nativeFocus: {
        type: focus.type, isTrusted: focus.isTrusted, ownerAlive: alive,
        targetTag: focus.target instanceof Element ? focus.target.tagName : null,
        targetId: focus.target instanceof Element ? focus.target.id : null,
        targetConnected: focus.target instanceof Node ? focus.target.isConnected : null,
        currentTargetTag: focus.currentTarget instanceof Element ? focus.currentTarget.tagName : null,
        currentTargetMatchesTarget: focus.currentTarget === focus.target,
        relatedTargetTag: focus.relatedTarget instanceof Element ? focus.relatedTarget.tagName : null
      } } : {})
    });
  };
  const recordDate = (name: string, date: Dayjs | null | undefined, text: unknown, info: unknown) => {
    callbackDates.push({
      name, actionIndex, value: snapshot(date), text,
      info: recorder.encode(info), rawInfo: recorder.raw(info),
      ownInfo: info != null && ['object', 'function'].includes(typeof info) ? recorder.own(info) : null
    });
  };

  const onChange = handler('change', function onChange(
    this: unknown,
    date: Dayjs | null,
    text: string
  ) {
    event('change', Array.from(arguments), this);
    recordDate('change', date, text, undefined);
    if (!initial.rejectChange) value = date;
  });
  const onCalendarChange = handler('calendar', function onCalendarChange(
    this: unknown, date: Dayjs | null, text: string, info: { source: 'date' | 'time' }
  ) {
    event('calendar', Array.from(arguments), this);
    recordDate('calendar', date, text, info);
  });
  const onOpenChange = handler('open', function onOpenChange(this: unknown, next: boolean) {
    event('open', Array.from(arguments), this);
    open = next;
  });
  const onPanelChange = handler('panel', function onPanelChange(
    this: unknown,
    date: Dayjs,
    mode: unknown
  ) {
    event('panel', Array.from(arguments), this);
    recordDate('panel', date, undefined, mode);
  });
  const onPickerValueChange = handler('picker-value', function onPickerValueChange(
    this: unknown,
    date: Dayjs,
    info?: unknown
  ) {
    event('picker-value', Array.from(arguments), this);
    recordDate('picker-value', date, undefined, info);
    if (initial.pickerOwner === 'accept') pickerValue = date;
  });
  const onOk = handler('ok', function onOk(this: unknown, date: Dayjs) {
    event('ok', Array.from(arguments), this);
    recordDate('ok', date, undefined, undefined);
  });
  const onFocus = handler('focus', function onFocus(this: unknown) {
    event('focus', Array.from(arguments), this);
  });
  const onBlur = handler('blur', function onBlur(this: unknown) {
    event('blur', Array.from(arguments), this);
  });
  const onClear = handler('clear', function onClear(this: unknown) {
    event('clear', Array.from(arguments), this);
  });

  const disabledDate = initial.disabledDay === undefined ? undefined : handler('disabled-date', function disabledDate(
    this: unknown, date: Dayjs, info: { type: string }
  ) {
    const result = date.format('YYYY-MM-DD') === initial.disabledDay;
    recorder.record('disabledDate', 'own', Array.from(arguments), result, {
      actionIndex, actualArgumentCount: arguments.length, receiver: receiver(this),
      date: snapshot(date), rawActualInfo: recorder.raw(info)
    });
    return result;
  });
  const disabledHours = initial.disabledHours === undefined ? undefined : handler('disabled-hours', function disabledHours(this: unknown) {
    const result = [...initial.disabledHours!];
    return recorder.record('disabledHours', 'own', Array.from(arguments), result, {
      actionIndex, actualArgumentCount: arguments.length, receiver: receiver(this)
    });
  });
  const disabledTimeResult = disabledHours ? { disabledHours } : undefined;
  const disabledTime = disabledHours === undefined ? undefined : handler('disabled-time', function disabledTime(
    this: unknown,
    date: Dayjs
  ) {
    return recorder.record('disabledTime', 'own', Array.from(arguments), disabledTimeResult!, {
      actionIndex, actualArgumentCount: arguments.length, receiver: receiver(this), date: snapshot(date)
    });
  });
  const provider = recorder.register({ theme: { token: { motion: false } }, locale: enUS }, {
    provider: 'picker-preset-transitions'
  });
  // Actual public Native props. control and nativeElement use separate Svelte bindings.
  let ownerProps: DatePickerProps = $derived({
    id: 'preset-field', name: 'retained-date', value, open, format, style: 'width:100%',
    allowClear: true, showNow: false, onChange, onCalendarChange, onOpenChange,
    onPanelChange, onPickerValueChange, onOk, onfocus: onFocus, onblur: onBlur, onClear,
    ...(presets === undefined ? {} : { presets }),
    ...(defaultPickerValue === undefined ? {} : { defaultPickerValue }),
    ...(initial.pickerOwner === 'omitted' ? {} : { pickerValue }),
    ...(preview === 'omitted' ? {} : { previewValue: preview }),
    ...(disabledDate === undefined ? {} : { disabledDate }),
    ...(disabledTime === undefined ? {} : { disabledTime }),
    ...(minDate === undefined ? {} : { minDate }),
    ...(maxDate === undefined ? {} : { maxDate }),
    ...(initial.showTime === undefined ? {} : { showTime: initial.showTime }),
    ...(initial.needConfirm === undefined ? {} : { needConfirm: initial.needConfirm })
  });

  export function read(): DatePickerPresetTransitionOwner {
    return {
      alive, open, format, preview, pickerOwner: initial.pickerOwner,
      value: snapshot(value), pickerValue: snapshot(pickerValue), minDate: snapshot(minDate),
      events: [...events], rawEvents: [...rawEvents], callbackInvocations: [...callbackInvocations],
      callbackDates: [...callbackDates], calls: [...recorder.calls],
      ownerActions: [...ownerActions], lifecycle: [...lifecycle],
      authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
      authoredPresets: recorder.encode(presets), rawAuthoredPresets: recorder.raw(presets),
      authoredSample: recorder.encode(initial), rawAuthoredSample: recorder.raw(initial),
      authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider),
      authoredDates: Object.fromEntries(Object.entries(authoredDates).map(([name, date]) => [name, snapshot(date)]))
    };
  }
  export function readRefs() {
    return { control: control ?? null, root: root ?? null, owner: owner ?? null };
  }
  export function setActionIndex(index: number) { actionIndex = index; }
  untrack(() => {
    if (capture) {
      capture.read = read;
      capture.readRefs = readRefs;
      capture.setActionIndex = setActionIndex;
    }
  });
  onMount(() => {
    if (control) recorder.register(control, { ref: 'control' });
    if (root) recorder.register(root, { ref: 'nativeElement' });
    if (owner) recorder.register(owner, { ref: 'owner' });
    alive = true;
    lifecycle.push({ phase: 'mount' });
    return () => {
      alive = false;
      lifecycle.push({ phase: 'unmount' });
    };
  });

  const ownerButtons: Array<{
    kind: DatePickerPresetTransitionOwnerControl;
    value: string | boolean
  }> = [
    { kind: 'open', value: true }, { kind: 'open', value: false },
    { kind: 'format', value: initial.alternateFormat ?? 'DD/MM/YYYY' },
    { kind: 'format', value: initial.format },
    { kind: 'preview', value: 'hover' }, { kind: 'preview', value: false },
    ...(updatedMinDate === undefined ? [] : [{
      kind: 'min-date' as const,
      value: initial.updatedMinDate!
    }])
  ];
  function ownerAction(
    kind: DatePickerPresetTransitionOwnerControl,
    next: string | boolean,
    mouse: MouseEvent
  ) {
    const args = Array.from(arguments);
    ownerActions.push({
      actionIndex, kind, value: next,
      // Source has a React nativeEvent wrapper. Here the underlying DOM event is mouse itself.
      event: { type: mouse.type, isTrusted: mouse.isTrusted, nativeIsTrusted: mouse.isTrusted },
      before: {
        open,
        format,
        preview,
        value: snapshot(value),
        pickerValue: snapshot(pickerValue),
        minDate: snapshot(minDate)
      },
      nativeMouse: {
        actualArgumentCount: args.length, arguments: recorder.encode(args), rawArguments: recorder.raw(args),
        targetTag: mouse.target instanceof Element ? mouse.target.tagName : null,
        currentTargetTag: mouse.currentTarget instanceof Element ? mouse.currentTarget.tagName : null,
        currentTargetMatchesTarget: mouse.currentTarget === mouse.target,
        nativeEventWrapperPresent: 'nativeEvent' in mouse
      }
    });
    if (kind === 'open') {
      open = next as boolean;
    }
    else if (kind === 'format') {
      format = next as string;
    }
    else if (kind === 'preview') {
      preview = next as false | 'hover';
    }
    else if (kind === 'min-date') minDate = updatedMinDate;
  }
  const box = datePickerPresetGeometry.root;
</script>

<section bind:this={owner} data-picker-presets-owner={initial.id}>
  <form data-preset-transition-form="">
    <ConfigProvider {...provider}>
      <div style={'position:absolute;'
        + `left:${(box.left) ?? ''}px;`
        + `top:${(box.top) ?? ''}px;`
        + `width:${(box.width) ?? ''}px`}>
        <DatePicker {...ownerProps} bind:this={control} bind:nativeElement={root} />
      </div>
    </ConfigProvider>
  </form>
  <div style={'position:fixed;'
    + 'left:16px;'
    + 'top:16px'}>
    {#each ownerButtons as button (button.kind + '-' + String(button.value))}
      <button type="button" data-transition-control={button.kind} data-transition-value={String(button.value)} onclick={event => ownerAction(button.kind, button.value, event)}>{button.kind + ' ' + String(button.value)}</button>
    {/each}
    <button type="button" data-picker-outside="">Outside</button>
  </div>
</section>
