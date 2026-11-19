<script lang="ts">
  import { flushSync } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import {
    ConfigProvider,
    DatePicker,
    RangePicker,
    TimePicker,
    TimeRangePicker,
    enUS,
    type DatePickerFormatConfig
  } from 'antd-svelte';

  type Owner = 'date' | 'datetime' | 'range' | 'time' | 'time-range';
  type Scenario = 'mouse' | 'reject-open' | 'plain-switch' | 'cancel-key' | 'reject-typed';
  type Pair = [Dayjs | null, Dayjs | null];
  type Value = Dayjs | Pair | null;
  type Entry = { name: 'calendar' | 'change' | 'open'; text: string };
  let { owner, scenario }: { owner: Owner; scenario: Scenario } = $props();
  const start = dayjs('2020-12-31T16:37:59.456').locale('en');
  const end = dayjs('2021-01-15T19:41:23.789').locale('en');
  const initialPair: [Dayjs, Dayjs] = [start, end];
  let single = $state.raw<Dayjs | null>(start);
  let pair = $state.raw<Pair | null>(initialPair);
  let open = $state(false);
  let usePlainFormat = $state(false);
  let masked = $derived(scenario !== 'reject-typed' && !usePlainFormat);
  let entries = $state<Entry[]>([]);
  let mouseDowns = $state<Array<{
    id: string;
    sameThis: boolean;
    currentInput: boolean;
    trusted: boolean;
  }>>([]);
  let keys = $state<Array<{ key: string; prevented: boolean }>>([]);
  let plainFormat = $derived(owner === 'datetime' ? 'YYYY-MM-DD HH:mm:ss.SSS'
    : owner === 'time' || owner === 'time-range' ? 'HH:mm:ss.SSS' : 'YYYY-MM-DD');
  let format = $derived<DatePickerFormatConfig | string>(masked
    ? { format: plainFormat, type: 'mask' } : plainFormat);
  const valueText = (value: Value): string => Array.isArray(value)
    ? value.map(date => date?.toISOString() ?? 'null').join('|') : value?.toISOString() ?? 'null';
  let modelText = $derived(valueText(owner === 'range' || owner === 'time-range' ? pair : single));

  function onMouseDown(
    this: HTMLInputElement,
    event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }
  ) {
    const input = event.currentTarget;
    mouseDowns.push({ id: input.id, sameThis: this === input,
      currentInput: input instanceof HTMLInputElement, trusted: event.isTrusted });
  }
  function onKeyDown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
    if (scenario === 'cancel-key' && event.key === '1') event.preventDefault();
    keys.push({ key: event.key, prevented: event.defaultPrevented });
  }
  function onCalendarChange(value: Value) {
    entries.push({ name: 'calendar', text: valueText(value) });
  }
  function changeSingle(value: Dayjs | null) {
    entries.push({ name: 'change', text: valueText(value) });
    single = value;
  }
  function changeRange(value: Pair | null) {
    entries.push({ name: 'change', text: valueText(value) });
    pair = value;
  }
  function onOpenChange(next: boolean) {
    entries.push({ name: 'open', text: String(next) });
    if (scenario !== 'reject-open') open = next;
  }
  function disabledDate(value: Dayjs) {
    return scenario === 'reject-typed' && value.format('YYYY-MM-DD') === '2021-02-03';
  }
  let common = $derived({
    format,
    open: scenario === 'reject-open' ? false : open,
    allowClear: false,
    onmousedown: onMouseDown,
    onkeydown: onKeyDown,
    onCalendarChange,
    onOpenChange,
    disabledDate
  });
</script>

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
  <section style="padding: 48px; width: 520px;">
    {#if owner === 'date'}
      <DatePicker {...common} id="contract-start" value={single} defaultPickerValue={start}
        onChange={changeSingle} />
    {:else if owner === 'datetime'}
      <DatePicker {...common} id="contract-start" value={single} defaultPickerValue={start}
        showTime={{ format: 'HH:mm:ss.SSS', showSecond: true, showMillisecond: true }}
        onChange={changeSingle} />
    {:else if owner === 'range'}
      <RangePicker {...common} id={{ start: 'contract-start', end: 'contract-end' }}
        value={pair} defaultPickerValue={initialPair} onChange={changeRange} />
    {:else if owner === 'time'}
      <TimePicker {...common} id="contract-start" value={single} defaultPickerValue={start}
        showSecond showMillisecond onChange={changeSingle} />
    {:else}
      <TimeRangePicker {...common} id={{ start: 'contract-start', end: 'contract-end' }}
        value={pair} defaultPickerValue={initialPair} showSecond showMillisecond
        onChange={changeRange} />
    {/if}
    <button type="button" data-contract-reset onclick={() => flushSync(() => {
      entries = [];
      mouseDowns = [];
      keys = [];
    })}>Reset observations</button>
    <button type="button" data-contract-plain onclick={() => flushSync(() => {
      usePlainFormat = true;
    })}>Use the same plain format</button>
    <output data-contract-profile>{masked ? 'mask' : 'plain'}</output>
    <output data-contract-model>{modelText}</output>
    <output data-contract-open>{String(scenario === 'reject-open' ? false : open)}</output>
    <ol data-contract-events>{#each entries as entry}
      <li data-contract-event={entry.name}>{entry.text}</li>
    {/each}</ol>
    <ol data-contract-mouse>{#each mouseDowns as event}
      <li data-input-id={event.id} data-this-input={String(event.sameThis)}
        data-current-input={String(event.currentInput)} data-trusted={String(event.trusted)}>mousedown</li>
    {/each}</ol>
    <ol data-contract-keys>{#each keys as event}
      <li data-key={event.key} data-prevented={String(event.prevented)}>{event.key}</li>
    {/each}</ol>
  </section>
</ConfigProvider>
