<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, enUS, type RangePickerValue } from '@woodger/antd';
  import reference from './ant-design-picker-confirmation-reference.json';

  const profiles = reference.cases.map(sample => sample.profile);
  let { preset = 'single-date-changed', open }: { preset?: string; open?: boolean; } = $props();
  let profile = $derived(profiles.find(item => item.id === preset) ?? profiles[0]);
  let events = $state<unknown[][]>([]);
  let acceptedSingle = $state.raw<Dayjs | null>();
  let acceptedRange = $state.raw<RangePickerValue | null>();
  let controlledOpen = $state(false);
  let pickerOpen = $derived(open ?? (profile.controlledOpen ? controlledOpen : undefined));

  const start = dayjs('2024-06-15');
  const end = dayjs('2024-06-23');
  const startTime = start.hour(13).minute(10).second(18);
  const endTime = end.hour(14).minute(26).second(40);
  const template = dayjs('2024-06-19T12:00:00');
  const templates: [Dayjs, Dayjs] = [template, template.hour(18)];
  let first = $derived(profile.datetime ? startTime : start);
  let last = $derived(profile.datetime ? endTime : end);
  let defaultDate = $derived(profile.missing === 'all' ? undefined : first);
  let defaultRange = $derived<RangePickerValue>([
    profile.missing === 'start' ? null : first,
    profile.missing === 'end' ? null : last
  ]);
  let allowEmpty = $derived<[boolean, boolean] | undefined>(
    profile.allowEmpty ? [profile.allowEmpty[0], profile.allowEmpty[1]] : undefined
  );
  let needConfirm = $derived(profile.datetime ? undefined : true);

  /** Switches an independent scenario and clears the history of the previous field. */
  function resetProfile() {
    events = [];
    acceptedSingle = undefined;
    acceptedRange = undefined;
    controlledOpen = false;
  }

  /** Translates the public arguments of Dayjs into a readable journal without changing the order. */
  function encode(value: Dayjs | RangePickerValue | null) {
    return Array.isArray(value)
      ? value.map(date => date?.toISOString() ?? null)
      : value?.toISOString() ?? null;
  }

  function onOpenChange(...args: [open: boolean]) {
    events.push(['open', args.length, args[0]]);
    if (profile.controlledOpen) controlledOpen = args[0];
  }

  function onCalendarChange(...args: [value: Dayjs | RangePickerValue | null, text: unknown,
    info: unknown]) {
    events.push(['calendar', args.length, encode(args[0]), args[1], args[2]]);
  }

  function onOk(...args: [value: Dayjs | RangePickerValue]) {
    const [selected] = args;
    events.push(['ok', args.length, encode(selected)]);
    if (profile.controlledOpen) {
      const confirmations = events.filter(event => event[0] === 'ok').length;
      if (confirmations === (profile.range ? 2 : 1)) controlledOpen = false;
    }
    if (profile.controlled !== 'accept-ok') {
      return;
    }

    if (Array.isArray(selected)) {
      acceptedRange = selected;
    }
    else {
      acceptedSingle = selected;
    }
  }

  function onChange(...args: [value: Dayjs | null, text: string]) {
    events.push(['change', args.length, encode(args[0]), args[1]]);
    if (profile.controlled === 'accept') acceptedSingle = args[0];
  }

  function onRangeChange(...args: [value: RangePickerValue | null, text: [string, string] | null]) {
    events.push(['change', args.length, encode(args[0]), args[1]]);
    if (profile.controlled === 'accept') acceptedRange = args[0];
  }
</script>

<section id="picker-confirmation-fixture">
  <select aria-label="Picker confirmation profile" bind:value={preset} onchange={resetProfile}>
    {#each profiles as item (item.id)}
      <option value={item.id}>{item.id}</option>
    {/each}
  </select>
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    {#key profile.id}
      {#if profile.range}
        <RangePicker id={{ start: 'start', end: 'end' }} open={pickerOpen} {needConfirm} {allowEmpty}
          showTime={profile.datetime ? { defaultOpenValue: profile.template ? templates : undefined } : false}
          showNow={false}
          defaultValue={defaultRange}
          value={profile.controlled ? acceptedRange === undefined ? defaultRange : acceptedRange : undefined}
          {onOpenChange} {onCalendarChange} {onOk} onChange={onRangeChange} />
      {:else}
        <DatePicker id="start" open={pickerOpen} {needConfirm} showTime={profile.datetime ?? false}
          showNow={false}
          disabledDate={profile.blocked ? date => date.date() === 15 : undefined}
          defaultValue={defaultDate}
          value={profile.controlled ? acceptedSingle === undefined ? defaultDate : acceptedSingle : undefined}
          {onOpenChange} {onCalendarChange} {onOk} {onChange} />
      {/if}
    {/key}
  </ConfigProvider>
  <output aria-label="Picker confirmation events">{JSON.stringify(events)}</output>
</section>
