<script module lang="ts">
  import type { GenerateConfig, RangePickerValue } from '@woodger/antd';

  declare const adapter: GenerateConfig<Date>;
  declare const value: RangePickerValue<Date>;
</script>

<script lang="ts">
  import { DatePicker } from '@woodger/antd';

  const Picker = DatePicker.generatePicker(adapter);
</script>

<Picker.RangePicker {value} onChange={next => next?.[0]?.getUTCFullYear()} />
<Picker.RangePicker picker="time" {value} onChange={next => next?.[1]?.getUTCHours()} />

<Picker.RangePicker value={[
  // @ts-expect-error The calendar range accepts Date values.
  123, null
]} />
<Picker.RangePicker picker="time" value={[
  // @ts-expect-error The time range accepts the same date type from the adapter.
  null, 456
]} />
