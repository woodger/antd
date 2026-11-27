<script module lang="ts">
  export type GeneratedPickerProfile = 'editor' | 'calendar' | 'range'
    | 'month' | 'month-grid' | 'time' | 'time-columns' | 'time-range'
    | 'multiple' | 'masked' | 'open-range' | 'controlled'
    | 'root-time' | 'child-time' | 'switch-time' | 'open-clock' | 'open-time-selection';

  export type GeneratedPickerHydrationProfile = 'open-range' | 'open-clock' | 'open-time-selection';

  export interface GeneratedTimeSelectionProfile {
    id: string;
    variant: 'date' | 'TimePicker';
    actions: string[];
    slot?: boolean;
    order?: boolean;
    needConfirm?: boolean;
    controlled?: boolean;
    presets?: boolean;
    empty?: boolean;
    template?: boolean;
    one?: boolean;
    duplicates?: boolean;
    precision?: boolean;
    open?: boolean;
  }
</script>

<script lang="ts">
  // Transmits opaque dates to the factory and records only observations of the field owner.
  import { ConfigProvider, DatePicker, enUS, type DatePickerPanelContext } from '@woodger/antd';
  import { opaqueDate, opaquePickerAdapter, readOpaqueDate, type OpaquePickerDate }
    from './opaque-picker-date-adapter';

  /** Browser transmits the script in URL, SSR and hydration set it explicitly. */
  function readProfile(): GeneratedPickerProfile {
    const profile = new URLSearchParams(globalThis.location?.search).get('profile');
    switch (profile) {
      case 'calendar': case 'range': case 'month': case 'time': case 'multiple':
      case 'month-grid': case 'time-columns': case 'time-range':
      case 'masked': case 'open-range': case 'controlled':
      case 'root-time': case 'child-time': case 'switch-time': case 'open-clock':
        return profile;
      default:
        return 'editor';
    }
  }

  /** Receives settings from the original browser profile for the time gain. */
  function readTimeSelection(): GeneratedTimeSelectionProfile | undefined {
    const reference = new URLSearchParams(globalThis.location?.search).get('time-selection');
    return reference ? JSON.parse(reference) : undefined;
  }

  let {
    profile = readProfile(), timeSelection: sourceTimeSelection = readTimeSelection()
  }: { profile?: GeneratedPickerProfile; timeSelection?: GeneratedTimeSelectionProfile; } = $props();
  const hydrationSelection: GeneratedTimeSelectionProfile = {
    id: 'open-time-selection', variant: 'TimePicker', actions: [], open: true
  };
  let timeSelection = $derived(
    profile === 'open-time-selection' ? hydrationSelection : sourceTimeSelection
  );
  const Picker = DatePicker.generatePicker(opaquePickerAdapter);
  const { MonthPicker, RangePicker, TimePicker } = Picker;
  const regularDates: [OpaquePickerDate, OpaquePickerDate] = [
    opaqueDate('2024-06-15T13:10:18Z'), opaqueDate('2024-06-23T14:26:40Z')
  ];
  const sameSecondDates: typeof regularDates = [
    regularDates[0], opaqueDate('2024-06-23T13:10:18Z')
  ];
  let dates = $derived(timeSelection?.duplicates ? sameSecondDates : regularDates);
  const view = opaqueDate('2024-06-19T11:00:00Z');
  const endOfMonthView = opaqueDate('2024-01-31T11:00:00Z');
  const rangeView: [OpaquePickerDate, OpaquePickerDate] = [view, view];
  const theme = { token: { motion: false } };
  const datePicker = { classNames: { root: 'date-owner' }, suffixIcon: 'Date configuration' };
  const timePicker = { classNames: { root: 'time-owner' }, suffixIcon: 'Time configuration' };
  let compareProvider = $derived(profile === 'root-time' || profile === 'child-time');
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
  let selectClock = $state(true);

  type Payload = OpaquePickerDate | (OpaquePickerDate | null)[] | null;

  /** Marks the references of the original values and the last onSelect of the custom panel. */
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

  /** Adds values and already calculated fields of events to the chronology of the owner. */
  function record(event: string, value: Payload, ...extra: unknown[]) {
    log = [...log, [event, encode(value), ...extra]];
  }

  /** Prepares a new value through the configuration that the custom panel has received. */
  function select(context: DatePickerPanelContext<OpaquePickerDate>, day: number) {
    const { generateConfig, pickerValue, mode } = context;
    selected = mode === 'month' ? generateConfig.addMonth(pickerValue, 2)
      : mode === 'time' ? generateConfig.setHour(pickerValue, day === 21 ? 16 : 18)
      : generateConfig.setDate(pickerValue, day);
    context.onSelect(selected);
  }

  /** Checks the navigation of the user month through the public action of the panel. */
  function navigate(context: DatePickerPanelContext<OpaquePickerDate>) {
    const next = context.generateConfig.addMonth(context.pickerValue, 1);
    context.onPickerValueChange(next);
  }

  /** Keeps the popup next to the form to observe the discovery and FormData through one owner. */
  function popupContainer(trigger: HTMLElement) {
    return trigger.parentElement ?? trigger.ownerDocument.body;
  }

  const callbacks = {
    // The calendar publishes a draft, including before the confirmation of the range.
    onCalendarChange: (value: Payload, text: string | string[], info: unknown) =>
      record('calendar', value, text, info),
    // Accepted value preserves a raw object or a pair without copying the dates.
    onChange: (value: Payload, text: string | string[] | null) => record('change', value, text),
    // The viewing date has its own sequence, separate from the accepted dates.
    onPickerValueChange: (value: Payload, info: unknown) => record('picker', value, info),
    // The panel level change communicates the current object and the new mode.
    onPanelChange: (value: Payload, mode: unknown) => record('panel', value, mode),
    // Saves an open state query without changing props.
    onOpenChange: (open: boolean) => { log = [...log, ['open', open]]; },
    // Accepts the value confirmed by the time button.
    onOk: (value: Payload) => record('ok', value)
  };

  let clockSelection = $derived.by(() => {
    if (!timeSelection) {
      return undefined;
    }
    const {
      id, slot, order, needConfirm, controlled, presets, empty, template, one, precision, open
    } = timeSelection;
    const withPanel = slot || id === 'multiple-time-slot';
    const showCalendar = profile === 'switch-time' && !selectClock;
    const options = {
      ...callbacks,
      id: 'start',
      name: 'opaque',
      format: showCalendar ? 'YYYY-MM-DD' : precision ? 'HH:mm:ss.SSS' : 'HH:mm:ss',
      millisecondStep: precision ? 100 : undefined,
      value: controlled ? dates : undefined,
      defaultValue: empty ? undefined : one ? [dates[0]] : dates,
      defaultPickerValue: view,
      defaultOpenValue: template ? view : undefined,
      defaultOpen: open,
      getPopupContainer: open ? undefined : popupContainer,
      components: withPanel ? timeSlots : undefined,
      order,
      needConfirm,
      presets: presets ? [{ label: 'Suggested clock', value: () => view }] : undefined,
      previewValue: false as const
    };
    return options;
  });
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

<ConfigProvider locale={enUS} {theme}
  datePicker={compareProvider ? datePicker : undefined}
  timePicker={compareProvider ? timePicker : undefined}>
  <form data-generated-picker-fixture aria-label="Opaque date form" onsubmit={event => {
    event.preventDefault();
    log = [...log, ['submit']];
  }}>
    {#if mounted}
      {#if clockSelection && timeSelection?.variant === 'TimePicker'}
        <TimePicker {...clockSelection} multiple bind:nativeElement bind:this={handle} />
      {:else if clockSelection}
        <Picker {...clockSelection}
          picker={profile === 'switch-time' && !selectClock ? 'date' : 'time'}
          multiple bind:nativeElement bind:this={handle} />
      {:else if profile === 'time-range'}
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
      {:else if profile === 'root-time' || profile === 'open-clock'}
        <Picker {...callbacks} picker="time" id="start" name="opaque" format="HH:mm:ss"
          defaultValue={dates[0]} defaultPickerValue={view}
          defaultOpen={profile === 'open-clock'}
          previewValue={false}
          getPopupContainer={profile === 'root-time' ? popupContainer : undefined}
          bind:nativeElement bind:this={handle} />
      {:else if profile === 'switch-time'}
        <Picker {...callbacks} picker={selectClock ? 'time' : 'date'} id="start" name="opaque"
          defaultValue={dates[0]} previewValue={false} getPopupContainer={popupContainer}
          bind:nativeElement bind:this={handle} />
      {:else if profile === 'time' || profile === 'time-columns' || profile === 'child-time'}
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
<button id="outside" type="button" style={'position:fixed;'
  + 'right:16px;'
  + 'bottom:16px'}>Outside</button>
<button id="new-value" type="button" onclick={() => { controlled = dates[1]; }}>New value</button>
<button id="focus-picker" type="button" onclick={() => handle?.focus()}>Focus</button>
{#if profile === 'switch-time'}
  <button id="switch-time" type="button" onclick={() => { selectClock = !selectClock; }}>
    Switch picker
  </button>
{/if}
<button id="remove-picker" type="button" style={'position:fixed;'
  + 'right:16px;'
  + 'bottom:58px'}
  onclick={() => { mounted = false; }}>Remove</button>
<output id="generated-events">{JSON.stringify(log)}</output>
<output id="generated-refs">{JSON.stringify([
  nativeElement?.tagName ?? null, startInput?.id ?? null, endInput?.id ?? null
])}</output>
