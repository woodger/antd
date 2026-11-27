<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import {
    ConfigProvider, DatePicker, TimePicker, TimeRangePicker, enUS, type RangePickerValue
  } from '@woodger/antd';
  import reference from './ant-design-picker-controlled-confirmation-reference.json';

  const profileId = new URLSearchParams(location.search).get('profile');
  const sample = reference.cases.find(item => item.profile.id === profileId);
  if (!sample) {
    throw new Error('Unknown controlled picker confirmation profile');
  }

  const { profile } = sample;
  const first = dayjs(profile.datetime ? '2024-06-15T13:10:18' : '2024-06-15');
  const last = dayjs('2024-06-23T14:26:40');
  const initial = profile.missing === 'all' ? undefined : first;
  const initialRange: RangePickerValue = [first, last];
  const initialList = [first];
  const template = profile.template ? dayjs('2024-06-19T12:00:00') : undefined;

  let value = $state.raw<Dayjs | null | undefined>(initial);
  let range = $state.raw<RangePickerValue | null>(initialRange);
  let values = $state.raw<Dayjs[] | null>(initialList);
  let open = $state(false);
  let events = $state<unknown[][]>([]);
  let confirmations = 0;

  type Selection = Dayjs | RangePickerValue | readonly Dayjs[] | null;

  /** Writes down the calendar accuracy of each public argument. */
  function encode(selection: Selection) {
    if (selection === null) {
      return null;
    }
    if ('toISOString' in selection) {
      return selection.toISOString();
    }
    return selection.map(date => date?.toISOString() ?? null);
  }

  /** He keeps an opening query log and accepts them for random open. */
  function onOpenChange(...args: [open: boolean]) {
    events.push(['open', args.length, args[0]]);
    if (profile.controlledOpen) open = args[0];
  }

  /** Saves the draft together with the text and info of the owner of the field. */
  function onCalendarChange(...args: [value: Selection, text: unknown, info: unknown]) {
    events.push(['calendar', args.length, encode(args[0]), args[1], args[2]]);
  }

  /** Records the publication, even if the owner has already accepted the choice from onOk. */
  function onChange(...args: [value: Selection, text: unknown]) {
    events.push(['change', args.length, encode(args[0]), args[1]]);
  }

  /** In the scenarios of the open controlled last confirmation itself closes the panel. */
  function recordOk(selection: Selection, arity: number) {
    events.push(['ok', arity, encode(selection)]);
    confirmations++;
    if (profile.controlledOpen && confirmations === (profile.range ? 2 : 1)) open = false;
  }

  /** Accepts a solitary result inside onOk. */
  function onOk(...args: [value: Dayjs]) {
    recordOk(args[0], args.length);
    if (profile.controlled === 'accept-ok') value = args[0];
  }

  /** Accepts both borders inside onOk. */
  function onRangeOk(...args: [value: RangePickerValue]) {
    recordOk(args[0], args.length);
    if (profile.controlled === 'accept-ok') range = args[0];
  }

  /** Receives an array of selected values within onOk. */
  function onListOk(...args: [value: Dayjs[]]) {
    recordOk(args[0], args.length);
    if (profile.controlled === 'accept-ok') values = args[0];
  }

  const shared = { showNow: false, onOpenChange, onCalendarChange, onChange };
  let pickerOpen = $derived(profile.controlledOpen ? open : undefined);
  let rangeProps = $derived({
    ...shared,
    open: pickerOpen, id: { start: 'start', end: 'end' },
    value: profile.controlled ? range : undefined, defaultValue: initialRange, onOk: onRangeOk
  });
  let listProps = $derived({
    ...shared,
    open: pickerOpen, id: 'start', multiple: true as const,
    value: profile.controlled ? values : undefined, defaultValue: initialList, onOk: onListOk
  });
  let fieldProps = $derived({
    ...shared,
    open: pickerOpen, id: 'start',
    value: profile.controlled ? value : undefined, defaultValue: initial, onOk
  });
</script>

<section id="picker-controlled-confirmation-fixture">
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    {#if profile.entry === 'time-range'}
      <TimeRangePicker {...rangeProps} />
    {:else if profile.entry === 'root-range'}
      <DatePicker.RangePicker {...rangeProps} picker="time" />
    {:else if profile.entry === 'time'}
      <TimePicker {...fieldProps} defaultOpenValue={template} />
    {:else if profile.entry === 'factory'}
      <DatePicker.TimePicker {...listProps} />
    {:else if profile.entry === 'date'}
      <DatePicker {...listProps} needConfirm />
    {:else if profile.multiple}
      <DatePicker {...listProps} picker="time" />
    {:else}
      <DatePicker {...fieldProps} picker="time" />
    {/if}
  </ConfigProvider>
  <output aria-label="Controlled picker confirmation events">{JSON.stringify(events)}</output>
</section>
