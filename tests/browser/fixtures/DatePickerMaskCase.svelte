<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, TimePicker, TimeRangePicker, enUS,
    type DatePickerProps, type RangePickerProps, type RangePickerValue,
    type TimePickerProps, type TimeRangePickerProps, type DatePickerDisabledTime } from '@woodger/antd';
  import { createDatePickerPresetsRecorder } from '../date-picker-presets-recorder.mjs';
  import { samples } from '../date-picker-mask-cases.mjs';
  import type { MaskAuthoredDateName, MaskControlName, MaskFormatProfile }
    from '../date-picker-mask-cases.mjs';
  import type { MaskCapture, MaskControl, MaskInvocation, MaskOwner }
    from '../date-picker-mask-native-types';

  let { owner, capture, initialFormatProfile }: {
    owner: MaskOwner; capture: MaskCapture; initialFormatProfile?: MaskFormatProfile
  } = $props();
  const selected = untrack(() => samples.find(sample => sample.id === owner));
  if (!selected) {
    throw Error('Choose one authored mask owner');
  }
  const sample = selected, output = untrack(() => capture);
  const range = sample.kind === 'range', time = sample.family === 'time';
  const recorder = createDatePickerPresetsRecorder();
  const authoredDate = (name: MaskAuthoredDateName) =>
    recorder.register(dayjs(sample[name]), { authoredDate: name });
  const authored = {
    initialStart: authoredDate('initialStart'),
    initialEnd: authoredDate('initialEnd')
  };
  const initialModel = range ? [authored.initialStart, authored.initialEnd] as RangePickerValue
    : authored.initialStart;
  const initialPanel = range ? [authored.initialStart, authored.initialStart] as [Dayjs, Dayjs]
    : authored.initialStart;
  const formats = {
    string: sample.plainFormat,
    object: recorder.register({ format: sample.plainFormat }, { authoredFormat: 'object' }),
    mask: recorder.register(
      { format: sample.maskFormat, type: 'mask' as const },
      { authoredFormat: 'mask' }
    )
  };
  const rangeIds = { start: 'mask-input', end: 'mask-end' };
  const theme = { token: { motion: false } };
  const clock = { format: 'HH:mm:ss.SSS', showSecond: true, showMillisecond: true };
  const noTimeRestrictions = recorder.register<DatePickerDisabledTime>(
    {},
    { authoredTimeRestrictions: true }
  );
  const callbacks: MaskInvocation[] = [], producers: MaskInvocation[] = [];
  const ownerActions: unknown[] = [], lifecycle: Array<{ phase: 'mount' | 'unmount' }> = [];
  let model = $state.raw<Dayjs | RangePickerValue | null>(initialModel), open = $state(false);
  let formatProfile = $state<MaskFormatProfile>(untrack(() => initialFormatProfile ?? sample.initialFormatProfile));
  let alive = false, actionIndex = -1, substepIndex = -1;
  let ownerElement = $state<HTMLElement>(), control = $state<MaskControl>(), root = $state<HTMLDivElement>();
  const dates = (value: Dayjs) => ({ identity: recorder.identity(value),
    encoded: recorder.encode(value), raw: recorder.raw(value),
    temporal: { valid: value.isValid(), epoch: value.valueOf(), iso: value.isValid() ? value.toISOString() : null,
      utcOffset: value.utcOffset(), fields: [value.year(), value.month(), value.date(), value.hour(),
        value.minute(), value.second(), value.millisecond()], locale: value.locale() },
    sameAsAuthored: Object.fromEntries(Object.entries(authored).map(([name, date]) => [name, date === value])) });
  function nestedDates(value: unknown, path: Array<string | number> = []): unknown[] {
    if (dayjs.isDayjs(value)) {
      return [{ path, value: dates(value) }];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => nestedDates(
        item,
        [...path, index]
      ));
    }
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      return Object.entries(value).flatMap(([key, item]) => nestedDates(item, [...path, key]));
    }
    return [];
  }
  const context = (value: unknown) => ({ type: typeof value, isUndefined: value === undefined,
    isNull: value === null, identity: value !== null && (typeof value === 'object' || typeof value === 'function')
      ? recorder.identity(value) : null });
  const invocation = (name: string, args: unknown[], receiver: unknown, index: number): MaskInvocation => ({
    index, actionIndex, substepIndex, name, actualArgumentCount: args.length,
    encodedArguments: recorder.encode(args), rawArguments: recorder.raw(args),
    dates: nestedDates(args), receiver: context(receiver) });
  const record = (name: string, args: unknown[], receiver: unknown) =>
    callbacks.push(invocation(name, args, receiver, callbacks.length));
  const handler = <Value,>(name: string, value: Value): Value => recorder.register(
    value,
    { callback: name }
  );
  const onChange = handler('change', function (this: unknown, next: Dayjs | RangePickerValue | null) {
    record('change', Array.from(arguments), this);
    model = next;
  });
  const onOpenChange = handler('open', function (this: unknown, next: boolean) {
    record('open', Array.from(arguments), this);
    open = next;
  });
  const onCalendarChange = handler('calendar', function (this: unknown) {
    record('calendar', Array.from(arguments), this);
  });
  const onPickerValueChange = handler('picker-value', function (this: unknown) {
    record('picker-value', Array.from(arguments), this);
  });
  const onPanelChange = handler('panel', function (this: unknown) {
    record('panel', Array.from(arguments), this);
  });
  const onOk = handler('ok', function (this: unknown) {
    record('ok', Array.from(arguments), this);
  });
  const onClear = handler('clear', function (this: unknown) {
    record('clear', Array.from(arguments), this);
  });
  function produce<Value>(
    name: string,
    args: unknown[],
    receiver: unknown,
    returned: Value
  ): Value {
    producers.push({ ...invocation(name, args, receiver, producers.length),
      returned: recorder.encode(returned), rawReturned: recorder.raw(returned),
      returnedIdentity: returned !== null && (typeof returned === 'object' || typeof returned === 'function')
        ? recorder.identity(returned) : null });
    return returned;
  }
  const disabledDate = recorder.register(function (this: unknown, _date: Dayjs) {
    return produce('disabledDate', Array.from(arguments), this, false);
  }, { producer: 'disabledDate' });
  const disabledTime = recorder.register(function (this: unknown, _date: Dayjs) {
    return produce('disabledTime', Array.from(arguments), this, noTimeRestrictions);
  }, { producer: 'disabledTime' });
  const shared = $derived({ open, format: formats[formatProfile], style: 'width:100%', disabledDate,
    onChange, onCalendarChange, onPickerValueChange, onPanelChange, onOpenChange, onOk, onClear });
  // The format object is transmitted through a public prop without being replaced by a string.
  const dateProps = $derived({ ...shared, picker: 'date', value: model as Dayjs | null,
    defaultPickerValue: initialPanel as Dayjs, id: 'mask-input',
    ...(sample.family === 'datetime' ? { showTime: clock, disabledTime } : {}) } satisfies DatePickerProps);
  const rangeProps = $derived({ ...shared, picker: 'date', value: model as RangePickerValue | null,
    defaultPickerValue: initialPanel as [Dayjs, Dayjs], id: rangeIds } satisfies RangePickerProps);
  const timeProps = $derived({ ...shared, value: model as Dayjs | null,
    defaultPickerValue: initialPanel as Dayjs, id: 'mask-input',
    showSecond: true, showMillisecond: true, disabledTime } satisfies TimePickerProps);
  const timeRangeProps = $derived({ ...shared, value: model as RangePickerValue | null,
    defaultPickerValue: initialPanel as [Dayjs, Dayjs], id: rangeIds,
    showSecond: true, showMillisecond: true, disabledTime } satisfies TimeRangePickerProps);
  const controls: MaskControlName[] = ['format-object', 'restore-authored-value', 'format-mask'];
  const delta = (rows: MaskInvocation[], cursor = 0) => {
    if (!Number.isInteger(cursor) || cursor < 0 || cursor > rows.length) {
      throw Error('Invalid observation cursor');
    }
    return { cursor, next: rows.length, rows: rows.slice(cursor) };
  };
  output.recorder = recorder;
  output.setActionIndex = index => {
    actionIndex = index;
    substepIndex = -1;
  };
  output.setSubstepIndex = index => { substepIndex = index; };
  output.readRefs = () => ({
    owner: ownerElement ?? null,
    control: control ?? null,
    root: root ?? null
  });
  output.readCallbacks = cursor => delta(callbacks, cursor);
  output.readProducers = cursor => delta(producers, cursor);
  output.read = () => {
    const value = formats[formatProfile];
    const props = time ? range ? timeRangeProps : timeProps : range ? rangeProps : dateProps;
    return { id: sample.id, family: sample.family, kind: sample.kind, picker: time ? 'time' : 'date',
      actionIndex, substepIndex, alive, open, formatProfile, model: recorder.encode(model), rawModel: recorder.raw(model),
      modelDates: nestedDates(model), producerCount: producers.length,
      formatValue: { type: typeof value, identity: typeof value === 'object' ? recorder.identity(value) : null,
        encoded: recorder.encode(value), raw: recorder.raw(value) },
      authoredDates: {
        initialStart: dates(authored.initialStart),
        initialEnd: dates(authored.initialEnd)
      },
      authoredProps: recorder.encode(props), rawAuthoredProps: recorder.raw(props),
      callbacks: [...callbacks], ownerActions: [...ownerActions], lifecycle: [...lifecycle] };
  };
  onMount(() => {
    alive = true;
    lifecycle.push({ phase: 'mount' });
    return () => {
      alive = false;
      lifecycle.push({ phase: 'unmount' });
    };
  });
</script>

<ConfigProvider locale={enUS} {theme}>
  <section bind:this={ownerElement} data-mask-owner={sample.id}
    style={'position:absolute;'
      + 'left:160px;'
      + 'top:80px;'
      + 'width:520px'}>
    {#if time && range}<TimeRangePicker {...timeRangeProps} bind:this={control} bind:nativeElement={root} />
    {:else if time}<TimePicker {...timeProps} bind:this={control} bind:nativeElement={root} />
    {:else if range}<RangePicker {...rangeProps} bind:this={control} bind:nativeElement={root} />
    {:else}<DatePicker {...dateProps} bind:this={control} bind:nativeElement={root} />{/if}
    {#each controls as value (value)}
      <button type="button" tabindex="-1" data-mask-control={value} onclick={event => {
        ownerActions.push({ actionIndex, substepIndex, value, type: event.type,
          isTrusted: event.isTrusted, targetTag: event.target instanceof Element ? event.target.tagName : null,
          currentTargetTag: event.currentTarget.tagName });
        if (value === 'restore-authored-value') model = initialModel;
        else formatProfile = value === 'format-object' ? 'object' : 'mask';
      }}>{value}</button>
    {/each}
  </section>
</ConfigProvider>
