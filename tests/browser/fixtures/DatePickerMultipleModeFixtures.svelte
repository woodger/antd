<script lang="ts">
  // Один владелец меняет режим без key и без записи нового defaultValue.
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, enUS, type DatePickerMultipleProps, type DatePickerProps }
    from '@woodger/antd';

  const initial = dayjs('2024-06-15T16:30:18');
  const initialPanel = dayjs('2024-06-19T11:00:00');
  const theme = { token: { motion: false } };
  let multiple = $state(false);
  let events = $state<unknown[][]>([]);

  /** Сохраняет порядок дат и исходное время при переходах между режимами. */
  function change(value: Dayjs | Dayjs[] | null, text: string | string[] | null) {
    const dates = Array.isArray(value) ? value : value ? [value] : null;
    events.push(['change', text, dates?.map(date => date.format('YYYY-MM-DD HH:mm:ss')) ?? null]);
  }

  let props: DatePickerProps | DatePickerMultipleProps = $derived(multiple
    ? { multiple: true, defaultValue: [initial], onChange: change }
    : { defaultValue: initial, onChange: change });
</script>

<ConfigProvider locale={enUS} {theme}>
  <div data-date-owner style="width:520px">
    <DatePicker {...props} id="new-mode" aria-label="Change date mode" name="mode"
      defaultPickerValue={initialPanel} onOpenChange={open => events.push(['open', open])}
      style="width:100%" />
  </div>
</ConfigProvider>
<button id="outside" type="button" style="position:fixed;right:16px;bottom:16px">Outside</button>
<button id="toggle" type="button" onclick={() => { multiple = !multiple; }}>Toggle</button>
<output id="multiple-events">{JSON.stringify(events)}</output>
