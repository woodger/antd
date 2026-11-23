<script lang="ts">
  import dayjs from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, enUS, type DatePickerPicker } from '@woodger/antd';
  let picker = $state<DatePickerPicker>('month');
  let showTime = $state(false);
  const date = dayjs('2024-01-31T16:37:59.456');
  const range: [typeof date, typeof date] = [date, date.add(1, 'year')];
  let calls = $state<string[]>([]);
  const record = (name: string) => { calls = [...calls, name]; };
</script>

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
  <label for="period-mode-single">Period single</label>
  <DatePicker id="period-mode-single" {picker} {showTime} value={date}
    onOpenChange={() => record('single-open')}
    onChange={() => record('single-change')} onCalendarChange={() => record('single-calendar')}
    onPickerValueChange={() => record('single-picker')} onPanelChange={() => record('single-panel')} />
  <label for="period-mode-range">Period range</label>
  <RangePicker id={{ start: 'period-mode-range', end: 'period-mode-end' }} {picker} {showTime} value={range}
    onOpenChange={() => record('range-open')}
    onChange={() => record('range-change')} onCalendarChange={() => record('range-calendar')}
    onPickerValueChange={() => record('range-picker')} onPanelChange={() => record('range-panel')} />
  <button type="button" data-period-mode-switch onclick={() => {
    picker = picker === 'month' ? 'year' : 'month';
  }}>Switch period</button>
  <button type="button" data-period-mode-date onclick={() => { picker = 'date'; }}>Select date mode</button>
  <button type="button" data-period-mode-quarter onclick={() => { picker = 'quarter'; }}>Select quarter mode</button>
  <button type="button" data-period-mode-week onclick={() => { picker = 'week'; }}>Select week mode</button>
  <button type="button" data-period-mode-time onclick={() => { showTime = true; }}>Enable date time</button>
  <output data-period-mode-model>{JSON.stringify({
    single: date.toISOString(), range: range.map(value => value.toISOString())
  })}</output>
  <output data-period-mode-calls>{JSON.stringify(calls)}</output>
</ConfigProvider>
