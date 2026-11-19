<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import 'dayjs/locale/en-gb.js';
  import { ConfigProvider, DatePicker, RangePicker, enUS, type DatePickerProps,
    type RangePickerProps, type RangePickerValue } from 'antd-svelte';
  import { createDatePickerPresetsRecorder } from '../date-picker-presets-recorder.mjs';
  import { samples } from '../date-picker-date-week-prefix-cases.mjs';
  import type { DateWeekPrefixAuthoredDateName, DateWeekPrefixControlName,
    DateWeekPrefixLocaleName } from '../date-picker-date-week-prefix-cases.mjs';
  import type { DateWeekPrefixCapture, DateWeekPrefixControl, DateWeekPrefixInvocation,
    DateWeekPrefixOwner } from '../date-picker-date-week-prefix-native-types';

  let { owner, capture }: { owner: DateWeekPrefixOwner; capture: DateWeekPrefixCapture } = $props();
  const selected = untrack(() => samples.find(sample => sample.id === owner));
  if (!selected) throw Error('Choose one authored date week-prefix owner');
  const sample = selected, output = untrack(() => capture), range = sample.kind === 'range';
  const recorder = createDatePickerPresetsRecorder();
  const authoredDate = (name: DateWeekPrefixAuthoredDateName) =>
    recorder.register(dayjs(sample[name]), { authoredDate: name });
  const authored = {
    initialStart: authoredDate('initialStart'),
    initialEnd: authoredDate('initialEnd')
  };
  const initialModel = range ? [authored.initialStart, authored.initialEnd] as RangePickerValue
    : authored.initialStart;
  const initialPanel = range ? [authored.initialStart, authored.initialStart] as [Dayjs, Dayjs]
    : authored.initialStart;
  const rangeIds = { start: 'week-input', end: 'week-end' };
  const providerTheme = { token: { motion: false } };
  const callbacks: DateWeekPrefixInvocation[] = [], producers: DateWeekPrefixInvocation[] = [];
  const ownerActions: unknown[] = [], lifecycle: Array<{ phase: 'mount' | 'unmount' }> = [];
  let model = $state.raw<Dayjs | RangePickerValue | null>(initialModel);
  let open = $state(false), weekNumbers = $state<boolean>(sample.initialShowWeek);
  let localeName = $state<DateWeekPrefixLocaleName>(sample.initialLocale);
  let localized = $derived(localeName === 'gb');
  let alive = false, actionIndex = -1;
  let ownerElement = $state<HTMLElement>(), control = $state<DateWeekPrefixControl>();
  let root = $state<HTMLDivElement>();
  const dates = (value: Dayjs) => ({ identity: recorder.identity(value),
    encoded: recorder.encode(value), raw: recorder.raw(value),
    temporal: { valid: value.isValid(), epoch: value.valueOf(), iso: value.isValid() ? value.toISOString() : null,
      utcOffset: value.utcOffset(), fields: [value.year(), value.month(), value.date(), value.hour(),
        value.minute(), value.second(), value.millisecond()], locale: value.locale() },
    sameAsAuthored: Object.fromEntries(Object.entries(authored).map(([name, date]) => [name, date === value])) });
  function nestedDates(value: unknown, path: Array<string | number> = []): unknown[] {
    if (dayjs.isDayjs(value)) return [{ path, value: dates(value) }];
    if (Array.isArray(value)) return value.flatMap((item, index) => nestedDates(
      item,
      [...path, index]
    ));
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
      return Object.entries(value).flatMap(([key, item]) => nestedDates(item, [...path, key]));
    return [];
  }
  const context = (value: unknown) => ({ type: typeof value, isUndefined: value === undefined,
    isNull: value === null, identity: value !== null && (typeof value === 'object' || typeof value === 'function')
      ? recorder.identity(value) : null });
  function invocation(name: string, args: unknown[], receiver: unknown, index: number): DateWeekPrefixInvocation {
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
    const returned = date.year() === sample.blocked.year && date.month() === sample.blocked.month
      && date.date() === sample.blocked.day;
    producers.push({ ...invocation('disabledDate', args, this, producers.length), returned });
    return returned;
  }, { producer: 'disabledDate' });
  const shared = $derived({ picker: sample.picker, open, showWeek: weekNumbers, style: 'width:100%',
    disabledDate, onChange, onCalendarChange, onPickerValueChange, onPanelChange, onOpenChange, onOk,
    ...(localized ? { locale: sample.localeGB } : {}) });
  const singleProps = $derived({ ...shared, value: model as Dayjs | null,
    defaultPickerValue: initialPanel as Dayjs, id: 'week-input' } satisfies DatePickerProps);
  const rangeProps = $derived({ ...shared, value: model as RangePickerValue | null,
    defaultPickerValue: initialPanel as [Dayjs, Dayjs], id: rangeIds } satisfies RangePickerProps);
  const controls: DateWeekPrefixControlName[] = ['hide-week-numbers', 'show-week-numbers', 'locale-gb'];
  const delta = (rows: DateWeekPrefixInvocation[], cursor = 0) => {
    if (!Number.isInteger(cursor) || cursor < 0 || cursor > rows.length) throw Error('Invalid observation cursor');
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
  output.read = () => ({ id: sample.id, actionIndex, alive, picker: sample.picker,
    open, weekNumbers, localeName, localized, model: recorder.encode(model), rawModel: recorder.raw(model),
    modelDates: nestedDates(model), producerCount: producers.length,
    authoredDates: Object.fromEntries(Object.entries(authored).map(([name, date]) => [name, dates(date)])),
    authoredProps: recorder.encode(range ? rangeProps : singleProps),
    rawAuthoredProps: recorder.raw(range ? rangeProps : singleProps),
    callbacks: [...callbacks], ownerActions: [...ownerActions], lifecycle: [...lifecycle] });
  onMount(() => {
    alive = true;
    lifecycle.push({ phase: 'mount' });
    return () => {
      alive = false;
      lifecycle.push({ phase: 'unmount' });
    };
  });
</script>

<ConfigProvider locale={enUS} theme={providerTheme}>
  <section bind:this={ownerElement} data-week-owner={sample.id}
    style="position:absolute;left:160px;top:80px;width:520px">
    {#if range}<RangePicker {...rangeProps} bind:this={control} bind:nativeElement={root} />
    {:else}<DatePicker {...singleProps} bind:this={control} bind:nativeElement={root} />{/if}
    {#each controls as value (value)}
      <button type="button" tabindex="-1" data-week-control={value} onclick={event => {
        ownerActions.push({ actionIndex, value, type: event.type, isTrusted: event.isTrusted,
          targetTag: event.target instanceof Element ? event.target.tagName : null,
          currentTargetTag: event.currentTarget.tagName });
        if (value === 'hide-week-numbers') weekNumbers = false;
        else if (value === 'show-week-numbers') weekNumbers = true;
        else localeName = 'gb';
      }}>{value}</button>
    {/each}
  </section>
</ConfigProvider>
