<script module lang="ts">
  import type { DatePickerMode, DatePickerPanelMode, DatePickerPicker } from '@woodger/antd';

  export interface PickerPanelProfile {
    id: string;
    slots: DatePickerPanelMode[];
    picker?: DatePickerPicker;
    mode?: DatePickerMode;
    time?: boolean;
    datetime?: boolean;
    range?: boolean;
    empty?: boolean;
    boundaries?: boolean;
    multiple?: boolean;
    showWeek?: boolean;
    rtl?: boolean;
    view?: boolean;
    preview?: boolean;
    open?: boolean;
    icons?: boolean;
    rejected?: boolean;
    blockedYear?: number;
  }

  export const panelHydrationProfile: PickerPanelProfile = {
    id: 'hydrate', slots: ['date','year'], range: true, open: true, rtl: true, icons: true
  };
</script>

<script lang="ts">
  // Reproduces public actions of React on a fresh package and checks the context of the panel.
  import dayjs, { type Dayjs } from 'dayjs';
  import { untrack } from 'svelte';
  import {
    ConfigProvider, DatePicker, RangePicker, TimePicker, TimeRangePicker, enUS,
    type DatePickerComponents, type DatePickerPanel, type DatePickerPanelContext,
    type RangePickerValue
  } from '@woodger/antd';

  /** At SSR the owner transmits the profile directly. */
  function readProfile(): PickerPanelProfile {
    const query = new URLSearchParams(globalThis.location?.search).get('profile');
    return query ? JSON.parse(query) : { id: 'date', slots: ['date'] };
  }

  let { profile = readProfile(), server = false }: {
    profile?: PickerPanelProfile;
    server?: boolean;
  } = $props();
  let mode = $state(untrack(() => profile.mode));
  let slotsActive = $state(true);
  let log = $state<unknown[][]>([]);
  let restrictionTrace: unknown[][] | undefined;
  let previewValue = $derived(profile.preview === false ? false as const : 'hover' as const);
  const dates: [Dayjs, Dayjs] = [
    dayjs('2024-06-15T13:10:18'), dayjs('2024-06-23T14:26:40')
  ];
  const defaultOpenValue = dayjs('2024-06-20T08:45:42');
  const clockConfig = { format: 'HH:mm', minuteStep: 15, defaultOpenValue };
  const rangeClock = {
    ...clockConfig, defaultOpenValue: [defaultOpenValue, defaultOpenValue.hour(18)] as [Dayjs, Dayjs]
  };
  const theme = { token: { motion: false } };
  const bothIds = { start: 'start', end: 'end' };
  const bounds = { minDate: dayjs('2024-06-10'), maxDate: dayjs('2024-08-31') };
  let view = $derived(dayjs(profile.time || profile.datetime
    ? '2024-06-19T11:00' : '2024-06-19'));
  let bothViews = $derived<[Dayjs, Dayjs]>([view, view]);
  let clockProps = $derived(profile.datetime ? clockConfig : undefined);
  let boundaryProps = $derived(profile.boundaries ? { ...bounds, disabledDate } : {});
  let icons = $derived(profile.icons ? { nextIcon: next, prevIcon: null } : {});
  let timeRestrictions = $derived(profile.blockedYear ? { disabledDate: disabledYear } : {});
  let components = $derived(componentMap(slotsActive ? profile.slots : []));

  /** Different keys model individual identities React renderer. */
  function componentMap(kinds: DatePickerPanelMode[]) {
    const available: Record<DatePickerPanelMode, DatePickerPanel> = {
      date: dateSlot, datetime: datetimeSlot, decade: decadeSlot, year: yearSlot,
      quarter: quarterSlot, month: monthSlot, week: weekSlot, time: timeSlot
    };
    const resolved: DatePickerComponents = {};
    for (const kind of kinds) resolved[kind] = available[kind];
    return resolved;
  }

  /** Saves the date, local clock and offset transmitted Dayjs. */
  function encode(value: Dayjs | readonly (Dayjs | null)[] | null | undefined) {
    if (Array.isArray(value)) {
      return value.map(item => item?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? null);
    }
    return dayjs.isDayjs(value) ? value.format('YYYY-MM-DDTHH:mm:ss.SSSZ') : null;
  }

  /** Uses a public adapter so that only the fields shown are changed, without rounding. */
  function selected({ generateConfig, pickerValue }: DatePickerPanelContext) {
    const date = generateConfig.setDate(pickerValue, profile.rejected ? 20 : 21);
    const hour = generateConfig.setHour(date, 16);
    return generateConfig.setMinute(hour, 7);
  }

  /** Removes the same context of the panel, which is visible to the manufacturer in React. */
  function observe(context: DatePickerPanelContext) {
    const { mode: kind, pickerValue, value, values, hoverValue, hoverRangeValue, showTime,
      minDate, maxDate, showWeek, locale, prefixCls: prefix, generateConfig } = context;
    const time = showTime && {
      format: showTime.format, showHour: showTime.showHour, showMinute: showTime.showMinute,
      showSecond: showTime.showSecond, showMillisecond: showTime.showMillisecond,
      use12Hours: showTime.use12Hours, minuteStep: showTime.minuteStep ?? null,
      defaultOpenValue: encode(showTime.defaultOpenValue)
    };
    return {
      kind, value: encode(value), values: encode(values), view: encode(pickerValue),
      hoverValue: encode(hoverValue), hoverRange: encode(hoverRangeValue), showTime: time,
      min: encode(minDate), max: encode(maxDate), week: showWeek ?? null,
      locale: locale.locale, localeFormat: locale.fieldDateTimeFormat, prefix,
      adapter: Object.keys(generateConfig).sort(),
      advanced: encode(generateConfig.addDate(pickerValue, 1)),
      hasDisabled: typeof context.disabledDate === 'function',
      disabledCount: typeof showTime?.disabledTime === 'function'
    };
  }

  /** Interrupts SSR with the unexpected publication of a component event. */
  function report(...event: unknown[]) {
    if (server) {
      throw Error('Picker event during SSR');
    }
    log.push(event);
  }

  /** The active boundary of the restriction is observed through from RangePicker. */
  function disabledDate(date: Dayjs, info: { type: string; from?: Dayjs; }) {
    restrictionTrace?.push(['restriction', encode(date), info.type, encode(info.from)]);
    return date.date() === 20;
  }

  /** Gives time fallback the usual restriction even after the transition in a year. */
  function disabledYear(date: Dayjs) {
    return date.year() === profile.blockedYear;
  }

  /** The date of the displayed instance can be shifted relative to pickerValue of the owner. */
  function changePicker(date: Dayjs | RangePickerValue, info: object) {
    report('picker', encode(date), info);
  }

  /** Publishes the proposed mode and date. */
  function changePanel(date: Dayjs | RangePickerValue, next: DatePickerMode | readonly DatePickerMode[]) {
    report('panel', encode(date), next);
  }

  /** Publishes a draft and range metadata. */
  function changeCalendar(date: Dayjs | Dayjs[] | RangePickerValue | null, text: unknown, info: object) {
    report('calendar', encode(date), text, info);
  }

  /** Publishes the result of the choice separately from the draft. */
  function change(date: Dayjs | Dayjs[] | RangePickerValue | null, text: unknown) {
    report('change', encode(date), text);
  }

  /** Time onOk allows you to check the procedure for confirmation. */
  function confirm(date: Dayjs | Dayjs[] | RangePickerValue) {
    report('ok', encode(date));
  }

  /** The opening is tracked regardless of the current authorized panel. */
  function openChange(open: boolean) {
    report('open', open);
  }

  /** Projection of the user limit of value and minDate. */
  function inspect(context: DatePickerPanelContext) {
    const { disabledDate, pickerValue } = context;
    const trace: unknown[][] = [];
    restrictionTrace = trace;
    try {
      const blocked = disabledDate(pickerValue.date(20), { type: 'date' });
      const beforeMin = disabledDate(pickerValue.date(5), { type: 'date' });
      for (const event of trace) report(...event);
      report('check', blocked, beforeMin);
    }
    finally {
      restrictionTrace = undefined;
    }
  }
</script>

{#snippet next()}<span data-custom-nav>›</span>{/snippet}
{#snippet footer(mode?: DatePickerMode)}<span data-footer-mode={mode}>{mode}</span>{/snippet}
{#snippet origin()}<span data-origin-cell>Origin</span>{/snippet}

{#snippet panel(context: DatePickerPanelContext)}
  <section data-custom-panel={context.mode} data-panel-state={JSON.stringify(observe(context))}>
    <button type="button" data-action="nav" onclick={() => context.onPickerValueChange(
      context.pickerValue.add(1, context.mode === 'year' ? 'year' : 'month'))}>Navigate</button>
    <button type="button" data-action="mode" onclick={() => context.onModeChange(
      'year', profile.view ? context.pickerValue.add(1, 'month') : undefined)}>Year</button>
    <button type="button" data-action="time-mode" onclick={() => context.onModeChange('time')}>Time</button>
    <button type="button" data-action="select" onclick={() => context.onSelect(selected(context))}>Select</button>
    <button type="button" data-action="hover" onclick={() => context.onHover(selected(context))}>Hover</button>
    <button type="button" data-action="unhover" onclick={() => context.onHover(null)}>Unhover</button>
    <button type="button" data-action="inspect" onclick={() => inspect(context)}>Inspect limits</button>
    {#if profile.icons}
      {#if typeof context.nextIcon === 'function'}{@render context.nextIcon()}{/if}
      {@render context.cellRender(context.pickerValue, {
        originNode: origin, prefixCls: context.prefixCls, today: context.generateConfig.getNow(),
        locale: context.locale, type: 'date', range: context.range
      })}
    {/if}
  </section>
{/snippet}
{#snippet dateSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet datetimeSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet decadeSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet yearSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet quarterSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet monthSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet weekSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}
{#snippet timeSlot(context: DatePickerPanelContext)}{@render panel(context)}{/snippet}

<ConfigProvider locale={enUS} {theme} direction={profile.rtl ? 'rtl' : 'ltr'}>
  <form aria-label="Panel form">
    <label for="start">Start</label>
    {#if profile.range}<label for="end">End</label>{/if}
    <div data-panel-owner>
      {#if profile.time && profile.range}
        <TimeRangePicker id={bothIds} name="chosen" {...clockConfig} {...icons} {...timeRestrictions}
          {previewValue} {components} open={profile.open}
          defaultValue={profile.empty ? undefined : dates} defaultPickerValue={bothViews}
          onPickerValueChange={changePicker} onPanelChange={changePanel} onOpenChange={openChange}
          onChange={change} onCalendarChange={changeCalendar} onOk={confirm} renderExtraFooter={footer} />
      {:else if profile.time}
        <TimePicker id="start" name="chosen" {...clockConfig} {...icons} {...timeRestrictions}
          {previewValue} {components} open={profile.open}
          defaultValue={profile.empty ? undefined : dates[0]} defaultPickerValue={view}
          onPickerValueChange={changePicker} onPanelChange={changePanel} onOpenChange={openChange}
          onChange={change} onCalendarChange={changeCalendar} onOk={confirm} renderExtraFooter={footer} />
      {:else if profile.range}
        <RangePicker id={bothIds} name="chosen" {...boundaryProps} {...icons}
          picker={profile.picker} {previewValue} {components} open={profile.open}
          showTime={profile.datetime ? rangeClock : undefined}
          mode={mode ? [mode, 'date'] : undefined} showWeek={profile.showWeek}
          defaultValue={profile.empty ? undefined : dates} defaultPickerValue={bothViews}
          onPickerValueChange={changePicker} onPanelChange={changePanel} onOpenChange={openChange}
          onChange={change} onCalendarChange={changeCalendar} onOk={confirm} renderExtraFooter={footer} />
      {:else if profile.multiple}
        <DatePicker multiple id="start" name="chosen" {...icons}
          picker={profile.picker} {mode} {previewValue} {components} open={profile.open}
          defaultValue={profile.empty ? undefined : dates} defaultPickerValue={view}
          onPickerValueChange={changePicker} onPanelChange={changePanel} onOpenChange={openChange}
          onChange={change} onCalendarChange={changeCalendar} onOk={confirm} renderExtraFooter={footer} />
      {:else}
        <DatePicker id="start" name="chosen" {...boundaryProps} {...icons} showTime={clockProps}
          picker={profile.picker} {mode} {previewValue} {components} open={profile.open}
          pickerValue={profile.view ? view : undefined} showWeek={profile.showWeek}
          defaultValue={profile.empty ? undefined : dates[0]} defaultPickerValue={view}
          onPickerValueChange={changePicker} onPanelChange={changePanel} onOpenChange={openChange}
          onChange={change} onCalendarChange={changeCalendar} onOk={confirm} renderExtraFooter={footer} />
      {/if}
    </div>
  </form>
</ConfigProvider>
<button type="button" id="accept" onclick={() => { mode = 'year'; }}>Accept mode</button>
<button type="button" id="toggle" onclick={() => { slotsActive = !slotsActive; }}>Toggle slots</button>
<button type="button" id="outside" style={'position:fixed;'
  + 'bottom:16px;'
  + 'right:16px'}>Outside</button>
<output id="panel-events">{JSON.stringify(log)}</output>
