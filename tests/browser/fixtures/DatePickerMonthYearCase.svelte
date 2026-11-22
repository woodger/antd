<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, enUS, type DatePickerProps,
    type RangePickerProps, type RangePickerValue, type DatePickerPreset,
    type RangePickerPreset } from '@woodger/antd-svelte';
  import { createDatePickerPresetsRecorder } from '../date-picker-presets-recorder.mjs';
  import { samples } from '../date-picker-month-year-cases.mjs';
  import type { MonthYearAuthoredDateName, MonthYearControlName } from '../date-picker-month-year-cases.mjs';
  import type { MonthYearCapture, MonthYearControl, MonthYearInvocation, MonthYearOwner }
    from '../date-picker-month-year-native-types';

  let { owner, capture }: { owner: MonthYearOwner; capture: MonthYearCapture } = $props();
  const selected = untrack(() => samples.find(sample => sample.id === owner));
  if (!selected) {
    throw Error('Choose one authored month/year owner');
  }
  const sample = selected, output = untrack(() => capture), range = sample.kind === 'range';
  const recorder = createDatePickerPresetsRecorder();
  const authoredDate = (name: MonthYearAuthoredDateName) =>
    recorder.register(dayjs(sample[name]), { authoredDate: name });
  const authored = { initialStart: authoredDate('initialStart'), initialEnd: authoredDate('initialEnd'),
    minDate: authoredDate('minDate'), maxDate: authoredDate('maxDate'), presetA: authoredDate('presetA'),
    presetB: authoredDate('presetB'), witnessStart: authoredDate('witnessStart'), witnessEnd: authoredDate('witnessEnd') };
  const initialModel: RangePickerValue = [authored.initialStart, authored.initialEnd];
  const initialPanel: [Dayjs, Dayjs] = [authored.initialStart, authored.initialStart];
  const reversed: [Dayjs, Dayjs] = [authored.presetA, authored.presetB];
  const singlePresets = recorder.register<DatePickerPreset[]>([
    { label: 'Hidden A', value: authored.presetA }, { label: 'Hidden B', value: authored.presetB }
  ], { authoredPresets: true });
  const rangePresets = recorder.register<RangePickerPreset[]>([
    { label: 'Hidden A', value: reversed }, { label: 'Hidden B', value: reversed }
  ], { authoredPresets: true });
  const callbacks: MonthYearInvocation[] = [], producers: MonthYearInvocation[] = [];
  const ownerActions: unknown[] = [], lifecycle: Array<{ phase: 'mount' | 'unmount' }> = [];
  let singleModel = $state.raw<Dayjs | null>(authored.initialStart);
  let rangeModel = $state.raw<RangePickerValue | null>(initialModel);
  let open = $state(false), needConfirm = $state<boolean | undefined>(undefined);
  let limited = $state(false), localized = $state(false), order = $state(true), witness = $state(false);
  let alive = false, actionIndex = -1;
  let ownerElement = $state<HTMLElement>(), control = $state<MonthYearControl>();
  let root = $state<HTMLDivElement>();
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
  function invocation(
    name: string,
    args: unknown[],
    receiver: unknown,
    index: number
  ): MonthYearInvocation {
    return { index, actionIndex, name, actualArgumentCount: args.length,
      encodedArguments: recorder.encode(args), rawArguments: recorder.raw(args),
      dates: nestedDates(args), receiver: context(receiver) };
  }
  function record(name: string, args: unknown[], receiver: unknown) {
    callbacks.push(invocation(name, args, receiver, callbacks.length));
  }
  const handler = <Value,>(name: string, value: Value): Value => recorder.register(
    value,
    { callback: name }
  );
  const onSingleChange = handler('change', function (this: unknown, next: Dayjs | null) {
    record('change', Array.from(arguments), this);
    singleModel = next;
  });
  const onRangeChange = handler('change', function (this: unknown, next: RangePickerValue | null) {
    record('change', Array.from(arguments), this);
    rangeModel = next;
  });
  const onOpenChange = handler('open', function (this: unknown, next: boolean) {
    record('open', Array.from(arguments), this);
    open = next;
  });
  const onCalendarChange = handler('calendar', function (this: unknown) {
    record('calendar', Array.from(arguments), this);
  });
  const onPanelChange = handler('panel', function (this: unknown) {
    record('panel', Array.from(arguments), this);
  });
  const onPickerValueChange = handler('picker-value', function (this: unknown) {
    record('picker-value', Array.from(arguments), this);
  });
  const onOk = handler('ok', function (this: unknown) {
    record('ok', Array.from(arguments), this);
  });
  const disabledDate = recorder.register(function (this: unknown, date: Dayjs) {
    const args = Array.from(arguments);
    const returned = Boolean(limited && date.year() === sample.blocked.year
      && (sample.blocked.month === undefined || date.month() === sample.blocked.month));
    producers.push({ ...invocation('disabledDate', args, this, producers.length), returned });
    return returned;
  }, { producer: 'disabledDate' });
  const shared = $derived({ open, style: 'width:100%', onCalendarChange, onPickerValueChange,
    onPanelChange, onOpenChange, onOk,
    ...(needConfirm === undefined ? {} : { needConfirm }),
    ...(limited ? { minDate: authored.minDate, maxDate: authored.maxDate, disabledDate } : {}),
    ...(localized ? { locale: sample.locale } : {}) });
  const singleBase = $derived({ ...shared, value: singleModel, defaultPickerValue: authored.initialStart,
    presets: singlePresets, id: 'month-year-input', onChange: onSingleChange } satisfies DatePickerProps);
  const rangeBase = $derived({ ...shared, value: rangeModel,
    defaultPickerValue: witness ? [authored.witnessStart, authored.witnessEnd] : initialPanel,
    presets: rangePresets, order, disabled: witness ? [true, false] : false,
    id: { start: 'month-year-input', end: 'month-year-end' }, onChange: onRangeChange } satisfies RangePickerProps);
  // Deliberately blocked until the public package declares and implements picker month/year.
  const singleProps = $derived({ picker: sample.picker, ...singleBase } satisfies DatePickerProps);
  const rangeProps = $derived({ picker: sample.picker, ...rangeBase } satisfies RangePickerProps);
  const rangeControls: MonthYearControlName[] = range ? ['order-false', 'order-true', 'same-period-disabled'] : [];
  const controls: MonthYearControlName[] = ['need-confirm-true', 'need-confirm-false', 'limits-on', 'limits-off',
    'locale', ...rangeControls];
  const delta = (rows: MonthYearInvocation[], cursor = 0) => {
    if (!Number.isInteger(cursor) || cursor < 0 || cursor > rows.length) {
      throw Error('Invalid observation cursor');
    }
    return { cursor, next: rows.length, rows: rows.slice(cursor) };
  };
  output.recorder = recorder;
  output.setActionIndex = index => { actionIndex = index; };
  output.readRefs = () => ({
    owner: ownerElement ?? null,
    control: control ?? null,
    root: root ?? null
  });
  output.readCallbacks = cursor => delta(callbacks, cursor);
  output.readProducers = cursor => delta(producers, cursor);
  output.read = () => {
    const model = range ? rangeModel : singleModel;
    return { id: sample.id, actionIndex, alive, picker: sample.picker, open, needConfirm,
      limited, localized, order, witness, model: recorder.encode(model), rawModel: recorder.raw(model),
      modelDates: nestedDates(model), producerCount: producers.length,
      authoredDates: Object.fromEntries(Object.entries(authored).map(([name, date]) => [name, dates(date)])),
      authoredProps: recorder.encode(range ? rangeProps : singleProps),
      rawAuthoredProps: recorder.raw(range ? rangeProps : singleProps),
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

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
  <section bind:this={ownerElement} data-month-year-owner={sample.id}
    style="position:absolute;left:160px;top:80px;width:520px">
    {#if range}<RangePicker {...rangeProps} bind:this={control} bind:nativeElement={root} />
    {:else}<DatePicker {...singleProps} bind:this={control} bind:nativeElement={root} />{/if}
    {#each controls as value (value)}
      <button type="button" tabindex="-1" data-month-year-control={value} onclick={event => {
        ownerActions.push({ actionIndex, value, type: event.type, isTrusted: event.isTrusted,
          targetTag: event.target instanceof Element ? event.target.tagName : null,
          currentTargetTag: event.currentTarget.tagName });
        if (value === 'need-confirm-true') needConfirm = true;
        else if (value === 'need-confirm-false') needConfirm = false;
        else if (value === 'limits-on') limited = true;
        else if (value === 'limits-off') limited = false;
        else if (value === 'locale') localized = true;
        else if (value === 'order-false') order = false;
        else if (value === 'order-true') order = true;
        else if (value === 'same-period-disabled') {
          witness = true; open = false; limited = false; needConfirm = false; order = true;
          rangeModel = [authored.witnessStart, null];
        }
      }}>{value}</button>
    {/each}
  </section>
</ConfigProvider>
