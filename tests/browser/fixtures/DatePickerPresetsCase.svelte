<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, enUS, type DatePickerMode } from 'antd-svelte';
  import Label from './DatePickerPresetsLabel.svelte';
  import { createDatePickerPresetsRecorder } from '../date-picker-presets-recorder.mjs';
  import { datePickerPresetGeometry, type DatePickerPresetSample } from '../date-picker-presets-cases.mjs';
  import type { DatePickerPresetCallbackInvocation, DatePickerPresetCapture, DatePickerPresetControl, DatePickerPresetLifecycle, DatePickerPresetValue } from '../date-picker-presets-metrics.mjs';
  let { sample, capture }: { sample: DatePickerPresetSample; capture?: DatePickerPresetCapture } = $props();
  const initial = untrack(() => sample), ownerCapture = untrack(() => capture), recorder = createDatePickerPresetsRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [], lazyCalls: unknown[] = [], callbackDates: unknown[] = [];
  const callbackInvocations: DatePickerPresetCallbackInvocation[] = [];
  const lifecycle: DatePickerPresetLifecycle[] = [], bodyActivity: Array<{
    id: string;
    text: string
  }> = [], returned: Dayjs[] = [];
  let value = $state.raw<Dayjs | null>(initial.initialValue == null ? null : dayjs(initial.initialValue));
  let open = $state(false), preview = $state<DatePickerPresetSample['preview']>(initial.preview);
  let control = $state<DatePickerPresetControl>(), root = $state<HTMLDivElement>(), owner = $state<HTMLElement>();
  let alive = false, actionIndex = -1;
  const temporal = (date: Dayjs | null) => date == null ? null : { isDayjs: dayjs.isDayjs(date), valid: date.isValid(), epoch: date.valueOf(),
    iso: date.isValid() ? date.toISOString() : null, utcOffset: date.utcOffset(),
    fields: [date.year(), date.month(), date.date(), date.hour(), date.minute(), date.second(), date.millisecond()] };
  const snapshot = (date: Dayjs | null): DatePickerPresetValue => ({ encoded: recorder.encode(date), raw: recorder.raw(date), temporal: temporal(date),
    identity: date == null ? null : recorder.identity(date), sameAsLazyReturns: returned.map(result => result === date) });
  const handler = <Value,>(name: string, callback: Value): Value => recorder.register(
    callback,
    { callback: 'picker-presets-' + name }
  );
  const event = (name: string, args: unknown[]) => {
    events.push(recorder.encode([name, ...args]));
    rawEvents.push(recorder.raw([name, ...args]));
    const focus = typeof FocusEvent !== 'undefined' && args[0] instanceof FocusEvent ? args[0] : null;
    callbackInvocations.push({ name, actionIndex, actualArgumentCount: args.length,
      arguments: recorder.encode(args), rawArguments: recorder.raw(args),
      ...(focus ? { nativeFocus: {
        type: focus.type, isTrusted: focus.isTrusted, ownerAlive: alive,
        targetTag: focus.target instanceof Element ? focus.target.tagName : null,
        targetId: focus.target instanceof Element ? focus.target.id : null,
        targetConnected: focus.target instanceof Node ? focus.target.isConnected : null,
        currentTargetTag: focus.currentTarget instanceof Element ? focus.currentTarget.tagName : null,
        currentTargetMatchesTarget: focus.currentTarget === focus.target,
        relatedTargetTag: focus.relatedTarget instanceof Element ? focus.relatedTarget.tagName : null
      } } : {}) });
  };
  const onChange = handler('change', function onChange(date: Dayjs | null, text: string) {
    event('change', Array.from(arguments));
    callbackDates.push({ name: 'change', value: snapshot(date), text });
    if (!initial.rejectChange) value = date;
  });
  const onCalendarChange = handler('calendar', function onCalendarChange(
    date: Dayjs | null,
    text: string,
    info: { source: 'date' | 'time' }
  ) {
    event('calendar', Array.from(arguments));
    callbackDates.push({ name: 'calendar', value: snapshot(date), text,
      actualInfo: recorder.encode(info), rawInfo: recorder.raw(info), ownInfo: recorder.own(info) });
  });
  const onOpenChange = handler('open', function onOpenChange(next: boolean) {
    event('open', Array.from(arguments));
    open = next;
  });
  const onPanelChange = handler('panel', function onPanelChange(date: Dayjs) {
    event('panel', Array.from(arguments));
    callbackDates.push({ name: 'panel', value: snapshot(date) });
  });
  const onOk = handler('ok', function onOk(date: Dayjs) {
    event('ok', Array.from(arguments));
    callbackDates.push({ name: 'ok', value: snapshot(date) });
  });
  const onPickerValueChange = handler('picker-value', function onPickerValueChange(date: Dayjs) {
    event('picker-value', Array.from(arguments));
    callbackDates.push({ name: 'picker-value', value: snapshot(date) });
  });
  const onFocus = handler('focus', function onFocus() { event('focus', Array.from(arguments)); });
  const onBlur = handler('blur', function onBlur() { event('blur', Array.from(arguments)); });
  const onClear = handler('clear', function onClear() { event('clear', Array.from(arguments)); });
  const defaultPickerValue = dayjs(initial.defaultPickerValue), minDate = initial.minDate ? dayjs(initial.minDate) : undefined,
    maxDate = initial.maxDate ? dayjs(initial.maxDate) : undefined;
  const disabledDate = initial.disabledDay ? handler('disabled-date', function disabledDate(
    date: Dayjs,
    info: { type: DatePickerMode }
  ) {
    const result = date.format('YYYY-MM-DD') === initial.disabledDay;
    recorder.record('disabledDate', 'own', Array.from(arguments), result, { actualArgumentCount: arguments.length,
      date: temporal(date), rawActualInfo: recorder.raw(info) });
    return result;
  }) : undefined;
  const customProfiles = initial.presets.filter(profile => profile.customLabel);
  if (customProfiles.length > 1) throw Error('This bounded caller expects at most the one authored custom label');
  const customProfile = customProfiles[0];
  const presets = initial.presets.map(profile => {
    let count = 0;
    const values = profile.sequence?.map(date => dayjs(date));
    const presetValue = values ? recorder.register(function lazyPreset(this: unknown) {
      'use strict';
      const result = values[count % values.length];
      count++;
      returned.push(result);
      const observation = { id: profile.id, index: count - 1, actionIndex, actualArgumentCount: arguments.length,
        argumentOwnDescriptors: recorder.own(arguments), arguments: recorder.encode(Array.from(arguments)), rawArgumentsObject: recorder.raw(arguments),
        receiver: { isUndefined: this === undefined, isNull: this === null, type: typeof this }, result: snapshot(result) };
      lazyCalls.push(observation);
      recorder.record('preset.value', 'own', Array.from(arguments), result, observation);
      return result;
    }, { producer: 'preset-value-' + profile.id }) : dayjs(profile.value);
    const label = profile.customLabel ? recorder.register(
      customLabel,
      { node: 'preset-label-' + profile.id }
    ) : profile.label;
    return { label, value: presetValue };
  });
  const provider = recorder.register(
    { theme: { token: { motion: false } }, locale: enUS },
    { provider: 'picker-presets' }
  );
  // Actual public Native props: style string, lowercase HTML focus hooks and a
  // separate bound nativeElement. No React-shaped control handle is synthesized.
  let ownerProps = $derived({ id: 'preset-field', value, open, presets, defaultPickerValue, format: initial.format,
    style: 'width:100%', allowClear: true, showNow: false, onChange, onCalendarChange, onOpenChange, onPanelChange, onPickerValueChange, onOk,
    onfocus: onFocus, onblur: onBlur, onClear, ...(preview === 'omitted' ? {} : { previewValue: preview }), ...(disabledDate ? { disabledDate } : {}),
    ...(minDate ? { minDate } : {}), ...(maxDate ? { maxDate } : {}), ...(initial.showTime ? { showTime: initial.showTime } : {}),
    ...(initial.needConfirm === null ? {} : { needConfirm: initial.needConfirm }), ...(initial.prefixCls ? { prefixCls: initial.prefixCls } : {}) });
  let last: { authoredProps: unknown; rawAuthoredProps: unknown } | undefined;
  export function read() {
    if (alive || !last) last = {
      authoredProps: recorder.encode(ownerProps),
      rawAuthoredProps: recorder.raw(ownerProps)
    };
    return { alive, open, preview, value: snapshot(value), events: [...events], rawEvents: [...rawEvents], callbackInvocations: [...callbackInvocations], lazyCalls: [...lazyCalls],
      calls: [...recorder.calls], callbackDates: [...callbackDates], lifecycle: [...lifecycle], bodyActivity: [...bodyActivity], ...last,
      authoredPresets: recorder.encode(presets), rawAuthoredPresets: recorder.raw(presets), authoredSample: recorder.encode(initial),
      rawAuthoredSample: recorder.raw(initial), authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
  }
  export function readRefs() {
    return { control: control ?? null, root: root ?? null, owner: owner ?? null };
  }
  export function setActionIndex(index: number) { actionIndex = index; }
  export function setPreview(next: 'hover' | false) { preview = next; }
  if (ownerCapture) {
    ownerCapture.read = read;
    ownerCapture.readRefs = readRefs;
    ownerCapture.setActionIndex = setActionIndex;
    ownerCapture.setPreview = setPreview;
  }
  onMount(() => {
    alive = true;
    return () => { alive = false; };
  });
  const box = datePickerPresetGeometry.root;
</script>
{#snippet customLabel()}{#if customProfile}<Label id={customProfile.id} text={customProfile.label} activity={bodyActivity} {lifecycle} />{/if}{/snippet}
<section bind:this={owner} data-picker-presets-owner={initial.id}>
  <ConfigProvider {...provider}><div style="position:absolute;left:{box.left}px;top:{box.top}px;width:{box.width}px"><DatePicker {...ownerProps} bind:this={control} bind:nativeElement={root} /></div></ConfigProvider>
  <div style="position:fixed;left:16px;top:16px"><button type="button" data-picker-outside="">Outside</button><button type="button" data-picker-preview="hover" onclick={() => { preview = 'hover'; }}>Preview hover</button><button type="button" data-picker-preview="false" onclick={() => { preview = false; }}>Preview false</button></div>
</section>
