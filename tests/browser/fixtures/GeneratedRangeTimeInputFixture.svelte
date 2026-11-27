<script lang="ts">
  // Checks the manual input through the public factory with its own UTC Date adapter.
  import { ConfigProvider, DatePicker, type GenerateConfig, type RangePickerValue }
    from '@woodger/antd';
  import dayjs from 'dayjs';
  import customParseFormat from 'dayjs/plugin/customParseFormat.js';
  import utc from 'dayjs/plugin/utc.js';
  import { calendarDateAdapter } from './calendar-date-adapter';

  dayjs.extend(customParseFormat);
  dayjs.extend(utc);

  const adapter: GenerateConfig<Date> = {
    ...calendarDateAdapter,
    getNow: () => new Date(),
    locale: {
      ...calendarDateAdapter.locale,
      format: (_locale, date, format) => dayjs.utc(date).format(format),
      // For the format without a date, the strict parser takes it from the browser clock.
      parse(_locale, text, formats) {
        for (const format of formats) {
          const parsed = dayjs.utc(text, format, true);
          if (parsed.isValid()) {
            return parsed.toDate();
          }
        }

        return null;
      }
    }
  };
  const Picker = DatePicker.generatePicker(adapter);
  const profile = new URLSearchParams(globalThis.location?.search).get('profile');
  const masked = profile === 'overnight-mask';
  const format = masked ? { format: 'HH:mm', type: 'mask' } as const
    : profile === 'format-list' ? ['YYYY-MM-DD HH:mm', 'HH:mm'] : 'HH:mm';
  const initial: RangePickerValue<Date> = masked ? [
    new Date('2026-10-15T23:45:58.123Z'), new Date('2026-10-16T01:30:22.456Z')
  ] : [
    new Date('2026-10-15T09:00:00Z'), new Date('2026-10-15T18:00:00Z')
  ];
  let value = $state.raw<RangePickerValue<Date> | null>(initial);
  let changes = $state.raw<unknown[]>([]);
</script>

<div data-generated-range-time-input-fixture>
  <ConfigProvider theme={{ token: { motion: false } }}>
    <Picker.RangePicker
      id={{ start: 'start', end: 'end' }}
      picker="time"
      {format}
      value={masked ? undefined : value}
      defaultValue={masked ? initial : undefined}
      previewValue={false}
      onChange={(next, strings) => {
        value = next;
        changes = [...changes, [next, strings]];
      }}
    />
  </ConfigProvider>
  <output data-testid="changes">{JSON.stringify(changes)}</output>
</div>
