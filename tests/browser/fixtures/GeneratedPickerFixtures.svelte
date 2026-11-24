<script module lang="ts">
  export type GeneratedPickerProfile = 'editor' | 'calendar' | 'range'
    | 'month' | 'month-grid' | 'time' | 'time-columns' | 'time-range'
    | 'multiple' | 'masked' | 'open-range' | 'controlled';
</script>

<script lang="ts">
  // Передаёт фабрике непрозрачные даты и записывает только наблюдения владельца поля.
  import { ConfigProvider, DatePicker, enUS, type DatePickerPanelContext } from '@woodger/antd';
  import { opaqueDate, opaquePickerAdapter, readOpaqueDate, type OpaquePickerDate }
    from './opaque-picker-date-adapter';

  /** Браузер передаёт сценарий в URL, SSR и hydration задают его явно. */
  function readProfile(): GeneratedPickerProfile {
    const profile = new URLSearchParams(globalThis.location?.search).get('profile');
    switch (profile) {
      case 'calendar': case 'range': case 'month': case 'time': case 'multiple':
      case 'month-grid': case 'time-columns': case 'time-range':
      case 'masked': case 'open-range': case 'controlled':
        return profile;
      default:
        return 'editor';
    }
  }

  let { profile = readProfile() }: { profile?: GeneratedPickerProfile; } = $props();
  const Picker = DatePicker.generatePicker(opaquePickerAdapter);
  const { MonthPicker, RangePicker, TimePicker } = Picker;
  const dates: [OpaquePickerDate, OpaquePickerDate] = [
    opaqueDate('2024-06-15T13:10:18Z'), opaqueDate('2024-06-23T14:26:40Z')
  ];
  const view = opaqueDate('2024-06-19T11:00:00Z');
  const endOfMonthView = opaqueDate('2024-01-31T11:00:00Z');
  const rangeView: [OpaquePickerDate, OpaquePickerDate] = [view, view];
  const theme = { token: { motion: false } };
  const ids = { start: 'start', end: 'end' };
  const mask = { format: 'YYYY-MM-DD', type: 'mask' } as const;
  const dateSlots = { date: panel };
  const monthSlots = { month: panel };
  const timeSlots = { time: panel };
  let log = $state.raw<unknown[][]>([]);
  let selected: OpaquePickerDate | undefined;
  let controlled = $state.raw<OpaquePickerDate>();
  let nativeElement = $state<HTMLDivElement>();
  let startInput = $state<HTMLInputElement>();
  let endInput = $state<HTMLInputElement>();
  let handle = $state<{ focus(): void; blur(): void; }>();
  let mounted = $state(true);

  type Payload = OpaquePickerDate | (OpaquePickerDate | null)[] | null;

  /** Отмечает ссылки исходных значений и последнего onSelect пользовательской панели. */
  function encode(value: Payload): unknown {
    if (Array.isArray(value)) {
      return value.map(encode);
    }
    if (!value) {
      return null;
    }

    return {
      iso: readOpaqueDate(value).toISOString(),
      original: dates.indexOf(value),
      selected: value === selected,
      frozen: Object.isFrozen(value),
      ownKeys: Object.keys(value)
    };
  }

  /** Добавляет значения и уже вычисленные поля события в хронологию владельца. */
  function record(event: string, value: Payload, ...extra: unknown[]) {
    log = [...log, [event, encode(value), ...extra]];
  }

  /** Готовит новое значение через конфигурацию, которую получила пользовательская панель. */
  function select(context: DatePickerPanelContext<OpaquePickerDate>, day: number) {
    const { generateConfig, pickerValue, mode } = context;
    selected = mode === 'month' ? generateConfig.addMonth(pickerValue, 2)
      : mode === 'time' ? generateConfig.setHour(pickerValue, day === 21 ? 16 : 18)
      : generateConfig.setDate(pickerValue, day);
    context.onSelect(selected);
  }

  /** Проверяет навигацию пользовательского месяца через публичное действие панели. */
  function navigate(context: DatePickerPanelContext<OpaquePickerDate>) {
    const next = context.generateConfig.addMonth(context.pickerValue, 1);
    context.onPickerValueChange(next);
  }

  /** Держит popup рядом с формой, чтобы наблюдать открытие и FormData через один owner. */
  function popupContainer(trigger: HTMLElement) {
    return trigger.parentElement ?? trigger.ownerDocument.body;
  }

  const callbacks = {
    // Календарь публикует черновик, в том числе до подтверждения диапазона.
    onCalendarChange: (value: Payload, text: string | string[], info: unknown) =>
      record('calendar', value, text, info),
    // Принятое значение сохраняет сырой объект или пару без копирования дат.
    onChange: (value: Payload, text: string | string[] | null) => record('change', value, text),
    // Дата просмотра имеет свою последовательность, отдельную от принятых дат.
    onPickerValueChange: (value: Payload, info: unknown) => record('picker', value, info),
    // Смена уровня панели сообщает текущий объект и новый mode.
    onPanelChange: (value: Payload, mode: unknown) => record('panel', value, mode),
    // Сохраняет запрос на изменение открытого состояния без изменения props.
    onOpenChange: (open: boolean) => { log = [...log, ['open', open]]; },
    // Принимает значение, подтверждённое кнопкой времени.
    onOk: (value: Payload) => record('ok', value)
  };
</script>

{#snippet panel(context: DatePickerPanelContext<OpaquePickerDate>)}
  <div data-opaque-panel data-adapter-same={context.generateConfig === opaquePickerAdapter}
    data-panel-view={readOpaqueDate(context.pickerValue).toISOString()}
    data-panel-value={JSON.stringify(encode(context.value ?? null))}>
    <button type="button" data-action="slot" onclick={() => select(context, 21)}>Pick opaque value</button>
    <button type="button" data-action="slot-next" onclick={() => select(context, 25)}>Pick later value</button>
    <button type="button" data-action="nav" onclick={() => navigate(context)}>Navigate</button>
  </div>
{/snippet}

<ConfigProvider locale={enUS} {theme}>
  <form data-generated-picker-fixture aria-label="Opaque date form" onsubmit={event => {
    event.preventDefault();
    log = [...log, ['submit']];
  }}>
    {#if mounted}
      {#if profile === 'time-range'}
        <RangePicker
          {...callbacks} id={ids} picker="time"
          name="opaque" format="HH:mm:ss" defaultValue={dates} defaultPickerValue={rangeView}
          components={timeSlots} previewValue={false} getPopupContainer={popupContainer}
          bind:nativeElement bind:startInput bind:endInput bind:this={handle}
        />
      {:else if profile === 'range' || profile === 'open-range'}
        <RangePicker
          {...callbacks} id={ids}
          name="opaque" format="YYYY-MM-DD" defaultValue={dates} defaultPickerValue={rangeView}
          open={profile === 'open-range' ? true : undefined}
          components={dateSlots} previewValue={false}
          getPopupContainer={profile === 'open-range' ? undefined : popupContainer}
          bind:nativeElement bind:startInput bind:endInput bind:this={handle}
        />
      {:else if profile === 'month' || profile === 'month-grid'}
        <MonthPicker {...callbacks} id="start" name="opaque" format="YYYY-MM"
          defaultValue={dates[0]}
          defaultPickerValue={profile === 'month-grid' ? endOfMonthView : view}
          components={profile === 'month' ? monthSlots : undefined}
          previewValue={false} getPopupContainer={popupContainer} bind:nativeElement />
      {:else if profile === 'time' || profile === 'time-columns'}
        <TimePicker {...callbacks} id="start" name="opaque" format="HH:mm:ss"
          defaultValue={dates[0]} defaultPickerValue={view}
          components={profile === 'time' ? timeSlots : undefined}
          previewValue={false} getPopupContainer={popupContainer} bind:nativeElement />
      {:else if profile === 'multiple'}
        <Picker {...callbacks} id="start" name="opaque" multiple format="YYYY-MM-DD"
          defaultValue={dates} defaultPickerValue={view} components={dateSlots}
          previewValue={false} getPopupContainer={popupContainer} bind:nativeElement />
      {:else}
        <Picker {...callbacks} id="start" name="opaque"
          format={profile === 'masked' ? mask : 'YYYY-MM-DD'} value={controlled}
          defaultValue={dates[0]} defaultPickerValue={view}
          previewValue={false} getPopupContainer={popupContainer} bind:nativeElement bind:this={handle}
        />
      {/if}
    {/if}
  </form>
</ConfigProvider>
<button id="outside" type="button" style="position:fixed;right:16px;bottom:16px">Outside</button>
<button id="new-value" type="button" onclick={() => { controlled = dates[1]; }}>New value</button>
<button id="focus-picker" type="button" onclick={() => handle?.focus()}>Focus</button>
<button id="remove-picker" type="button" style="position:fixed;right:16px;bottom:58px"
  onclick={() => { mounted = false; }}>Remove</button>
<output id="generated-events">{JSON.stringify(log)}</output>
<output id="generated-refs">{JSON.stringify([
  nativeElement?.tagName ?? null, startInput?.id ?? null, endInput?.id ?? null
])}</output>
