<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import {
    ConfigProvider, DatePicker, RangePicker, enUS,
    type DatePickerTimeConfig, type RangePickerValue
  } from '@woodger/antd';
  import reference from './ant-design-picker-clock-options-reference.json';

  type Settings = Omit<DatePickerTimeConfig, 'disabledTime' | 'defaultOpenValue'>;
  type Profile = {
    id: string;
    top: Settings;
    nested?: Settings;
    range?: boolean;
    picker?: string;
    empty?: boolean;
    template?: string;
    nestedTemplate?: boolean;
    restrictions?: boolean;
  };

  const profiles: Profile[] = reference.cases.map(sample => sample.profile);
  let { preset = 'single-top-clock', defaultOpen = false }: {
    preset?: string;
    defaultOpen?: boolean;
  } = $props();
  let sample = $derived(profiles.find(profile => profile.id === preset) ?? profiles[0]);
  let events = $state<unknown[][]>([]);
  const start = dayjs('2024-06-15T13:10:18');
  const end = dayjs('2024-06-23T14:26:40');
  const template = dayjs('2024-06-19T12:00:00');
  const templates: [Dayjs, Dayjs] = [template, template.hour(18)];
  const nestedTemplates: [Dayjs, Dayjs] = [template.hour(16), template.hour(22)];

  function disabledAtField() {
    return { disabledMinutes: () => [20] };
  }

  function disabledInShowTime() {
    return { disabledMinutes: () => [40] };
  }

  function encode(value: Dayjs | RangePickerValue | null) {
    return Array.isArray(value)
      ? value.map(date => date?.toISOString() ?? null)
      : value?.toISOString() ?? null;
  }

  function onCalendarChange(value: Dayjs | RangePickerValue | null, text: unknown, info: unknown) {
    events.push(['calendar', encode(value), text, info]);
  }

  function onChange(value: Dayjs | RangePickerValue | null, text: unknown) {
    events.push(['change', encode(value), text]);
  }

  function onOpenChange(open: boolean) {
    events.push(['open', open]);
  }

  function onOk(value: Dayjs | RangePickerValue) {
    events.push(['ok', encode(value)]);
  }

  function rangeOptions(profile: Profile) {
    const presetTime = profile.template === 'pair' ? templates : profile.template ? template
      : undefined;
    const value: [Dayjs, Dayjs] | undefined = profile.empty ? undefined : [start, end];
    const nested = profile.nested && {
      ...profile.nested,
      ...(profile.restrictions ? { disabledTime: disabledInShowTime } : {}),
      ...(profile.nestedTemplate ? { defaultOpenValue: nestedTemplates } : {})
    };

    return {
      ...profile.top, defaultOpenValue: presetTime, defaultValue: value, showTime: nested ?? true,
      disabledTime: profile.restrictions ? disabledAtField : undefined,
      id: { start: 'start', end: 'end' }, defaultOpen,
      onCalendarChange, onChange, onOpenChange, onOk
    };
  }

  function singleOptions(profile: Profile) {
    const nested = profile.nested && {
      ...profile.nested,
      ...(profile.restrictions ? { disabledTime: disabledInShowTime } : {})
    };

    return {
      ...profile.top, defaultOpenValue: profile.template ? template : undefined,
      defaultValue: profile.empty ? undefined : start, showTime: nested ?? true,
      disabledTime: profile.restrictions ? disabledAtField : undefined,
      id: 'start', defaultOpen, onCalendarChange, onChange, onOpenChange, onOk
    };
  }
</script>

<section id="picker-clock-options-fixture">
  <select aria-label="Picker clock options" bind:value={preset} onchange={() => { events = []; }}>
    {#each profiles as profile (profile.id)}
      <option value={profile.id}>{profile.id}</option>
    {/each}
  </select>
  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    {#key sample.id}
      {#if sample.picker === 'time'}
        <DatePicker.RangePicker {...rangeOptions(sample)} picker="time" />
      {:else if sample.range}
        <RangePicker {...rangeOptions(sample)} />
      {:else}
        <DatePicker {...singleOptions(sample)} />
      {/if}
    {/key}
  </ConfigProvider>
  <output aria-label="Picker clock events">{JSON.stringify(events)}</output>
</section>
