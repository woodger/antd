<script lang="ts">
  import dayjs from 'dayjs';
  import { ConfigProvider, DatePicker, enUS } from 'antd-svelte';

  const value = dayjs('2024-06-13T16:37:00.000');
  const showTime = { format: 'HH:mm', minuteStep: 15, hideDisabledOptions: false };
  const theme = { token: { motion: false } };
  const enabled = { disabledMinutes: () => [] };
  const restricted = { disabledMinutes: () => [0] };
  const enabledTime = () => enabled;
  const restrictedTime = () => restricted;
  let open = $state(false);
  let disableZero = $state(false);
  let changes = $state<string[]>([]);
</script>

<ConfigProvider locale={enUS} {theme}>
  <section id="date-picker-offgrid-scroll-fixture"
    style="position:absolute;left:320px;top:120px;width:320px">
    <DatePicker id="offgrid-scroll-input" {value} {open} {showTime} showNow={false}
      format="YYYY-MM-DD HH:mm" style="width:100%"
      disabledTime={disableZero ? restrictedTime : enabledTime}
      onOpenChange={next => { open = next; }}
      onChange={(_value, text) => { changes = [...changes, `change:${text}`]; }}
      onCalendarChange={(_value, text) => { changes = [...changes, `calendar:${text}`]; }} />
    <div style="margin-top:16px">
      <button type="button" onclick={() => { open = false; }}>Close off-grid picker</button>
      <button type="button" onclick={() => { disableZero = true; }}>Disable minute zero</button>
      <button type="button" onclick={() => { open = true; }}>Reopen off-grid picker</button>
    </div>
    <output aria-label="Off-grid value changes">{JSON.stringify(changes)}</output>
  </section>
</ConfigProvider>
