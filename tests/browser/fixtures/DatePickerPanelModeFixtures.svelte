<script module lang="ts">
  import type { DatePickerMode, DatePickerPicker, RangePickerMode } from '@woodger/antd';

  export interface PickerModeProfile {
    id: string;
    mode: DatePickerMode | RangePickerMode;
    picker?: DatePickerPicker;
    range?: boolean;
    multiple?: boolean;
    showTime?: boolean;
    accept?: boolean;
    controlView?: boolean;
    withoutPreview?: boolean;
    needConfirm?: boolean;
    open?: boolean;
    min?: string;
    max?: string;
    disableMay?: boolean;
  }

  export const panelModeHydrationProfile = {
    id: 'hydrate', range: true, mode: ['year', 'month'], withoutPreview: true
  } satisfies PickerModeProfile;
</script>

<script lang="ts">
  // Один владелец меняет mode и pickerValue, сохраняя поля и принятые даты.
  import dayjs, { type Dayjs } from 'dayjs';
  import { untrack } from 'svelte';
  import {
    ConfigProvider, DatePicker, RangePicker, enUS, type RangePickerValue
  } from '@woodger/antd';

  /** Берёт профиль независимого браузерного замера из параметра фикстуры. */
  function readProfile(): PickerModeProfile {
    const parameter = new URLSearchParams(globalThis.location?.search).get('profile');

    return parameter ? JSON.parse(parameter) : { id: 'fixed-year', mode: 'year' };
  }

  let { profile = readProfile(), server = false }: {
    profile?: PickerModeProfile;
    server?: boolean;
  } = $props();

  const dates: [Dayjs, Dayjs] = [
    dayjs('2024-06-15T13:10:18'), dayjs('2024-06-23T14:26:40')
  ];
  const panel = dayjs('2024-06-19T11:00:00');
  const rangePanels: [Dayjs, Dayjs] = [panel, panel];
  const theme = { token: { motion: false } };
  let mode = $state.raw<DatePickerMode | RangePickerMode | undefined>(untrack(() => profile.mode));
  let singleMode = $derived(Array.isArray(mode) ? undefined : mode);
  let rangeMode = $derived(Array.isArray(mode) ? mode : undefined);
  let view = $state.raw(panel);
  let events = $state<unknown[][]>([]);
  let minDate = $derived(profile.min ? dayjs(profile.min) : undefined);
  let maxDate = $derived(profile.max ? dayjs(profile.max) : undefined);

  /** Сохраняет время и смещение Dayjs в том же формате, что и эталон. */
  function encode(value: Dayjs | null | Dayjs[] | RangePickerValue) {
    if (Array.isArray(value)) {
      return value.map(date => date?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? null);
    }
    return value?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? null;
  }

  /** На SSR события пользователя и поиск popup target недопустимы. */
  function report(...event: unknown[]) {
    if (server) {
      throw Error('Unexpected DatePicker mode event during SSR');
    }
    events.push(event);
  }

  /** Принимает предложенную панель только в профилях с управляемым переходом. */
  function panelChange(date: Dayjs | RangePickerValue, next: DatePickerMode | RangePickerMode) {
    report('panel', encode(date), next);
    if (profile.accept) {
      mode = next;
    }
  }

  /** Управление в обход browser focus воспроизводит внешнее обновление props. */
  function updateMode(event: Event & { currentTarget: HTMLInputElement; }) {
    const next: DatePickerMode | RangePickerMode | null = JSON.parse(event.currentTarget.value);
    mode = next ?? undefined;
  }

  /** Дата панели обновляется независимо от режима и выбора. */
  function updateView(event: Event & { currentTarget: HTMLInputElement; }) {
    view = dayjs(event.currentTarget.value);
  }

  /** Ошибка чтения portal target на сервере сразу прерывает пакетную проверку. */
  function readServerPortal(_trigger: HTMLElement): never {
    throw Error('Unexpected DatePicker mode portal target during SSR');
  }

  /** Правило одинаково для всех дат мая, включая оба края панели месяца. */
  function disabledDate(date: Dayjs) {
    return Boolean(profile.disableMay && date.month() === 4);
  }
</script>

<ConfigProvider locale={enUS} {theme}>
  <form aria-label="Calendar form">
    <label for="mode-start">Start date</label>
    {#if profile.range}<label for="mode-end">End date</label>{/if}
    <div data-mode-owner style="width:520px">
      {#if profile.range}
        <RangePicker
          id={{ start: 'mode-start', end: 'mode-end' }}
          name="mode-dates"
          picker={profile.picker}
          mode={rangeMode}
          open={profile.open}
          showTime={profile.showTime}
          defaultValue={dates}
          defaultPickerValue={rangePanels}
          needConfirm={profile.needConfirm}
          {minDate} {maxDate} {disabledDate}
          getPopupContainer={server ? readServerPortal : undefined}
          previewValue={profile.withoutPreview ? false : undefined}
          onOpenChange={open => report('open', open)}
          onCalendarChange={(date, text, info) => report('calendar', encode(date), text, info)}
          onPickerValueChange={(date, info) => report('picker', encode(date), info)}
          onPanelChange={panelChange}
          onChange={(date, text) => report('change', encode(date), text)}
        />
      {:else if profile.multiple}
        <DatePicker multiple
          id="mode-start" name="mode-dates"
          picker={profile.picker}
          mode={singleMode}
          open={profile.open}
          defaultValue={dates}
          defaultPickerValue={panel}
          {minDate} {maxDate} {disabledDate}
          getPopupContainer={server ? readServerPortal : undefined}
          previewValue={profile.withoutPreview ? false : undefined}
          onOpenChange={open => report('open', open)}
          onCalendarChange={(date, text, info) => report('calendar', encode(date), text, info)}
          onPickerValueChange={(date, info) => report('picker', encode(date), info)}
          onPanelChange={panelChange}
          onChange={(date, text) => report('change', encode(date), text)}
        />
      {:else}
        <DatePicker id="mode-start" name="mode-dates"
          picker={profile.picker}
          mode={singleMode}
          open={profile.open}
          showTime={profile.showTime}
          defaultValue={dates[0]}
          defaultPickerValue={panel}
          pickerValue={profile.controlView ? view : undefined}
          needConfirm={profile.needConfirm}
          {minDate} {maxDate} {disabledDate}
          getPopupContainer={server ? readServerPortal : undefined}
          previewValue={profile.withoutPreview ? false : undefined}
          onOpenChange={open => report('open', open)}
          onCalendarChange={(date, text, info) => report('calendar', encode(date), text, info)}
          onPickerValueChange={(date, info) => report('picker', encode(date), info)}
          onPanelChange={panelChange}
          onChange={(date, text) => report('change', encode(date), text)}
        />
      {/if}
    </div>
  </form>
</ConfigProvider>
<input id="owner-mode" type="hidden" oninput={updateMode} />
<input id="owner-view" type="hidden" oninput={updateView} />
<button id="outside" type="button" style="position:fixed;right:16px;bottom:16px">Outside</button>
<output id="mode-events">{JSON.stringify(events)}</output>
