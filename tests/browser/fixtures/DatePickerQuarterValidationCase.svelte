<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, enUS } from '@woodger/antd';
  let { kind }: { kind: 'single' | 'range' } = $props();
  const start = dayjs('2024-01-31T16:37:59.456');
  const end = dayjs('2024-11-20T09:12:34.567');
  const range: [Dayjs, Dayjs] = [start, end];
  const calls: unknown[] = [], changes: unknown[] = [];
  let snapshot = $state('');
  const temporal = (value: Dayjs) => ({
    fields: [value.year(), value.month(), value.date(), value.hour(), value.minute(), value.second(), value.millisecond()],
    iso: value.toISOString(), epoch: value.valueOf(), sameAsStart: value === start, sameAsEnd: value === end
  });
  function disabledDate(value: Dayjs, info: { type: string; from?: Dayjs }) {
    const rejected = value !== start && (kind === 'single' || value !== end);
    calls.push({ actualArgumentCount: arguments.length, value: temporal(value),
      infoKeys: Object.keys(info), type: info.type, hasFrom: Object.hasOwn(info, 'from'),
      from: info.from ? temporal(info.from) : null, rejected });
    return rejected;
  }
  function onChange(value: Dayjs | [Dayjs | null, Dayjs | null] | null) {
    changes.push(Array.isArray(value) ? value.map(item => item ? temporal(item) : null)
      : value ? temporal(value) : null);
  }
</script>

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
  {#if kind === 'single'}
    <DatePicker id="quarter-validation" picker="quarter" value={start} defaultPickerValue={start}
      {disabledDate} {onChange} />
  {:else}
    <RangePicker id={{ start: 'quarter-validation', end: 'quarter-validation-end' }} picker="quarter"
      value={range} defaultPickerValue={range} {disabledDate} {onChange} />
  {/if}
  <button type="button" data-quarter-validation-read onclick={() => {
    snapshot = JSON.stringify({ calls: [...calls], changes: [...changes],
      model: kind === 'single' ? temporal(start) : range.map(temporal) });
  }}>Read actual validation</button>
  <output data-quarter-validation-snapshot>{snapshot}</output>
</ConfigProvider>
