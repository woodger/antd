<script lang="ts">
  import type { Dayjs } from 'dayjs';
  import { tick, type Snippet } from 'svelte';
  import { dayjsGenerateConfig as adapter } from './date-picker-dayjs.engine';
  import {
    calendarCells, pickerCalendarValue, pickerDateDisabled, pickerPanelDateDisabled, samePickerQuarter,
    samePickerWeek
  } from './date-picker.engine';
  import type {
    DatePickerMode, DatePickerPicker, DatePickerProps, DatePickerCellRenderInfo
  } from './date-picker.types';
  import type { PickerLocale } from './picker-locale.types';
  let {
    prefixCls,
    picker = 'date',
    showWeek,
    panel,
    timeTemplate,
    selected,
    hovered,
    mode,
    locale,
    restrictions,
    now,
    direction,
    range,
    cellRender,
    cellRange,
    onHover,
    preserveDisabledHover = false,
    showPrevious = true,
    showNext = true,
    onSelect,
    onNavigate,
    onModeChange
  }: {
    prefixCls: string;
    picker?: DatePickerPicker;
    showWeek?: boolean;
    panel: Dayjs;
    timeTemplate?: Dayjs;
    selected: Dayjs | null;
    hovered?: Dayjs | null;
    mode: DatePickerMode;
    direction: 'ltr' | 'rtl';
    range?: readonly [Dayjs | null, Dayjs | null];
    cellRender?: DatePickerProps['cellRender'];
    cellRange?: 'start' | 'end';
    onHover?: (value: Dayjs | null) => void;
    preserveDisabledHover?: boolean;
    showPrevious?: boolean;
    showNext?: boolean;
    locale: PickerLocale;
    restrictions: Pick<DatePickerProps, 'minDate' | 'maxDate' | 'disabledDate'>;
    now: Dayjs;
    onSelect: (value: Dayjs) => void;
    onNavigate: (value: Dayjs) => void;
    onModeChange: (mode: DatePickerMode, viewDate?: Dayjs) => void;
  } = $props();
  let renderToday = $derived.by(() => {
    void prefixCls;
    void picker;
    void showWeek;
    void mode;
    void panel;
    void timeTemplate;
    void selected;
    void hovered;
    void range;
    void direction;
    void showPrevious;
    void showNext;
    void locale;
    void cellRender;
    void cellRange;
    void restrictions;
    void now;
    return adapter.getNow();
  });
  let root: HTMLDivElement;
  // rc-picker нормализует только время calendar pickerValue, отдельно от выбранного value.
  let cellPanel = $derived(pickerCalendarValue(panel, timeTemplate));
  let cells = $derived.by(() => {
    void renderToday;
    return calendarCells(cellPanel, mode, locale.locale);
  });
  let datePanel = $derived(mode === 'date' || mode === 'week');
  let weekPanel = $derived(mode === 'week');
  let weekPrefix = $derived(datePanel && (showWeek ?? weekPanel));
  let width = $derived(datePanel ? 7 : mode === 'quarter' ? 4 : 3);
  let weeks = $derived(locale.shortWeekDays ?? adapter.locale.getShortWeekDays!(locale.locale));
  let months = $derived(locale.shortMonths ?? adapter.locale.getShortMonths!(locale.locale));
  let firstDay = $derived(adapter.locale.getWeekFirstDay(locale.locale));
  let unit = $derived<'day' | 'month' | 'year'>(
    datePanel ? 'day' : mode === 'month' || mode === 'quarter' ? 'month' : 'year'
  );
  function cellInfo(originNode: Snippet): DatePickerCellRenderInfo {
    return { prefixCls, originNode, today: renderToday, type: mode, locale, range: cellRange };
  }
  function label(date: Dayjs) {
    const format = mode === 'quarter' ? locale.fieldQuarterFormat ?? 'YYYY-[Q]Q'
      : mode === 'month' ? locale.fieldMonthFormat ?? 'YYYY-MM'
      : mode === 'year' ? locale.fieldYearFormat ?? 'YYYY' : undefined;
    return format && (picker !== 'date' || mode === 'quarter')
      ? adapter.locale.format(locale.locale, date, format)
      : date.format(datePanel ? 'YYYY-MM-DD' : mode === 'month' ? 'YYYY-MM' : 'YYYY');
  }
  function cellText(date: Dayjs) {
    if (mode === 'month' && !locale.monthFormat) return months[date.month()];
    const format = mode === 'quarter' ? locale.cellQuarterFormat ?? '[Q]Q'
      : datePanel ? locale.cellDateFormat ?? 'D'
      : mode === 'month' ? locale.monthFormat! : locale.cellYearFormat ?? 'YYYY';
    const text = adapter.locale.format(locale.locale, date, format);
    return mode === 'decade'
      ? `${text}-${adapter.locale.format(locale.locale, date.add(9, 'year'), format)}` : text;
  }
  function move(amount: number, large = false) {
    onNavigate(
      datePanel
        ? cellPanel.add(amount, large ? 'year' : 'month')
        : cellPanel.add(
          amount * (mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100),
          'year'
        )
    );
  }
  function selectedCell(date: Dayjs) {
    return selected
      ? weekPanel ? samePickerWeek(selected, date, locale.locale)
      : mode === 'quarter' ? samePickerQuarter(selected, date)
      : mode === 'decade'
        ? Math.floor(selected.year() / 10) === Math.floor(date.year() / 10)
        : selected.isSame(date, unit)
      : false;
  }
  function sameCell(value: Dayjs | null | undefined, date: Dayjs) {
    return value && (picker !== 'date' && mode === 'decade'
      ? Math.floor(value.year() / 10) === Math.floor(date.year() / 10)
      : weekPanel ? samePickerWeek(value, date, locale.locale)
      : mode === 'quarter' ? samePickerQuarter(value, date) : value.isSame(date, unit));
  }
  function inRangeCell(date: Dayjs) {
    if (!range?.[0] || !range[1]) return false;
    return mode === 'quarter'
      ? !samePickerQuarter(date, range[0]) && !samePickerQuarter(date, range[1])
        && date.isAfter(range[0]) && date.isBefore(range[1])
      : date.isAfter(range[0], unit) && date.isBefore(range[1], unit);
  }
  function unavailable(date: Dayjs) {
    return picker === 'date' ? pickerDateDisabled(date, restrictions, mode, locale.locale)
      : pickerPanelDateDisabled(date, restrictions, mode, locale.locale);
  }
  function headerDisabled(amount: number, large = false) {
    if (weekPanel) {
      const target = cellPanel.add(amount, large ? 'year' : 'month');
      return amount < 0
        ? !!restrictions.minDate && target.endOf('month').isBefore(restrictions.minDate, 'day')
        : !!restrictions.maxDate && target.startOf('month').isAfter(restrictions.maxDate, 'day');
    }
    if (picker === 'date' || mode === 'date') return false;
    const target = cellPanel.add(
      amount * (mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100),
      'year'
    );
    const size = mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100;
    const first = Math.floor(target.year() / size) * size;
    const last = first + size - 1;
    return amount < 0
      ? !!restrictions.minDate && last < restrictions.minDate.year()
      : !!restrictions.maxDate && first > restrictions.maxDate.year();
  }
  function weekRowClasses(date: Dayjs) {
    if (!weekPanel) return undefined;
    const start = range?.[0] && samePickerWeek(range[0], date, locale.locale);
    const end = range?.[1] && samePickerWeek(range[1], date, locale.locale);
    return [
      `${prefixCls}-week-panel-row`,
      !range && selectedCell(date) && `${prefixCls}-week-panel-row-selected`,
      start && `${prefixCls}-week-panel-row-range-start`,
      end && `${prefixCls}-week-panel-row-range-end`,
      range?.[0] && range[1] && !start && !end
        && date.isAfter(range[0]) && date.isBefore(range[1]) && `${prefixCls}-week-panel-row-range-hover`,
      hovered && samePickerWeek(hovered, date, locale.locale) && `${prefixCls}-week-panel-row-hover`
    ];
  }
  async function key(event: KeyboardEvent, date: Dayjs) {
    let next: Dayjs;
    const step = mode === 'decade' ? 10 : mode === 'quarter' ? 3 : 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      next = date.add(
        (event.key === 'ArrowLeft' ? -1 : 1) * (direction === 'rtl' ? -1 : 1) * step,
        unit
      );
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
      next = date.add((event.key === 'ArrowUp' ? -1 : 1) * width * step, unit);
    else if (event.key === 'PageUp' || event.key === 'PageDown')
      next = datePanel
        ? date.add(event.key === 'PageUp' ? -1 : 1, event.shiftKey ? 'year' : 'month')
        : date.add(
          (event.key === 'PageUp' ? -1 : 1) * (mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100),
          'year'
        );
    else if (event.key === 'Home' || event.key === 'End')
      next = datePanel
        ? event.key === 'Home' ? date.startOf('month') : date.endOf('month')
        : mode === 'month' || mode === 'quarter'
          ? date.month(event.key === 'Home' ? 0 : mode === 'quarter' ? 9 : 11)
          : date.year(
            Math.floor(date.year() / (mode === 'year'
              ? 10
              : 100)) * (mode === 'year'
                ? 10
                : 100) + (event.key === 'Home'
                  ? 0
                  : mode === 'year' ? 9 : 90)
          );
    else return;
    event.preventDefault();
    const sign = next.isBefore(date) ? -1 : 1;
    for (let n = 0; n < 3660 && unavailable(next); n++) {
      if (sign > 0
        && restrictions.maxDate
        && !(weekPanel && samePickerWeek(next, restrictions.maxDate, locale.locale))
        && next.startOf(unit).isAfter(
          restrictions.maxDate.endOf(unit)
        )
        || sign < 0
        && restrictions.minDate
        && !(weekPanel && samePickerWeek(next, restrictions.minDate, locale.locale))
        && next.endOf(unit).isBefore(
          restrictions.minDate.startOf(unit)
        )) return;
      next = next.add(sign * step, unit);
    }
    if (unavailable(next)) return;
    const previous = event.target instanceof HTMLElement ? event.target : undefined;
    // Смена месяца переносит дни между keyed-строками; удерживаем фокус внутри popup.
    root.closest<HTMLElement>(`.${prefixCls}-panel`)?.focus({ preventScroll: true });
    onNavigate(next);
    await tick();
    (root?.querySelector<HTMLButtonElement>(`[data-picker-date="${label(next)}"]`)
      ?? (previous?.isConnected && root?.contains(previous) ? previous : undefined))?.focus();
  }
</script>
<style>
  .date-cell { color:inherit;border:0;background:transparent;padding:0;font:inherit;cursor:pointer; }
  .date-cell:focus-visible { outline:2px solid var(--ant-color-primary);outline-offset:-2px; }
</style>
<div bind:this={root} class={[`${prefixCls}-${mode}-panel`, datePanel && showWeek && `${prefixCls}-${mode}-panel-show-week`]}>
  <div class={`${prefixCls}-header`}>
    <button type="button" tabindex="-1" class={[`${prefixCls}-header-super-prev-btn`, headerDisabled(-1, true) && `${prefixCls}-header-super-prev-btn-disabled`]} disabled={headerDisabled(-1, true)} style:visibility={showPrevious ? undefined : 'hidden'} aria-label={locale.previousYear} onclick={() => move(-1, true)}><span class={`${prefixCls}-super-prev-icon`}></span></button>
    {#if datePanel}<button type="button" tabindex="-1" class={[`${prefixCls}-header-prev-btn`, headerDisabled(-1) && `${prefixCls}-header-prev-btn-disabled`]} disabled={headerDisabled(-1)} style:visibility={showPrevious ? undefined : 'hidden'} aria-label={locale.previousMonth} onclick={() => move(-1)}><span class={`${prefixCls}-prev-icon`}></span></button>{/if}
    <div class={`${prefixCls}-header-view`}>
      {#if datePanel}<button type="button" tabindex="-1" class={`${prefixCls}-month-btn`} aria-label={locale.monthSelect} onclick={() => onModeChange('month', cellPanel)}>{locale.monthFormat
          ? adapter.locale.format(locale.locale, panel, locale.monthFormat) : months[panel.month()]}</button>{/if}{#if picker !== 'date' && mode === 'decade'}{adapter.locale.format(locale.locale, panel.year(Math.floor(panel.year() / 100) * 100), locale.yearFormat ?? 'YYYY')}-{adapter.locale.format(locale.locale, panel.year(Math.floor(panel.year() / 100) * 100 + 99), locale.yearFormat ?? 'YYYY')}{:else}<button type="button" tabindex="-1" class={`${prefixCls}-${picker !== 'date' && mode === 'year' ? 'decade' : 'year'}-btn`} aria-label={mode === 'year' || mode === 'decade'
          ? locale.decadeSelect
          : locale.yearSelect} onclick={() => onModeChange(
              datePanel || mode === 'month' || mode === 'quarter' ? 'year' : 'decade', cellPanel
            )}>{mode === 'year'
            ? `${Math.floor(panel.year() / 10) * 10}-${Math.floor(panel.year() / 10) * 10 + 9}`
            : mode === 'decade'
              ? `${Math
                .floor(panel
                  .year() / 100) * 100}-${Math
                    .floor(panel
                      .year() / 100) * 100 + 99}`
              : adapter.locale.format(locale.locale, panel, locale.yearFormat ?? 'YYYY')}</button>{/if}
    </div>
    {#if datePanel}<button type="button" tabindex="-1" class={[`${prefixCls}-header-next-btn`, headerDisabled(1) && `${prefixCls}-header-next-btn-disabled`]} disabled={headerDisabled(1)} style:visibility={showNext ? undefined : 'hidden'} aria-label={locale.nextMonth} onclick={() => move(1)}><span class={`${prefixCls}-next-icon`}></span></button>{/if}
    <button type="button" tabindex="-1" class={[`${prefixCls}-header-super-next-btn`, headerDisabled(1, true) && `${prefixCls}-header-super-next-btn-disabled`]} disabled={headerDisabled(1, true)} style:visibility={showNext ? undefined : 'hidden'} aria-label={locale.nextYear} onclick={() => move(1, true)}><span class={`${prefixCls}-super-next-icon`}></span></button>
  </div>
  <div class={`${prefixCls}-body`}>
    <table class={`${prefixCls}-content`} role="grid" aria-label={panel.format('YYYY-MM')}>
      {#if datePanel}<thead><tr>{#if weekPrefix}<th scope="col"><span style="width:0;height:0;position:absolute;overflow:hidden;opacity:0">{locale.week}</span></th>{/if}{#each weeks as _, n}<th scope="col">{weeks[(n + firstDay) % 7]}</th>{/each}</tr></thead>{/if}
      <tbody>
        {#each Array.from({ length: cells.length / width }, (_, n) => n) as row}
          {@const rowDate = cells[row * width]}
          <tr class={weekRowClasses(rowDate)}>{#if weekPrefix}
              {@const prefixDisabled = pickerDateDisabled(rowDate, restrictions, 'week', locale.locale)}
              <td class={[`${prefixCls}-cell`, `${prefixCls}-cell-week`, prefixDisabled && `${prefixCls}-cell-disabled`]}
                aria-disabled={prefixDisabled || undefined} onclick={() => { if (!prefixDisabled) onSelect(rowDate); }}
                onkeydown={event => {
                  if (event.target instanceof HTMLButtonElement && event.target.hasAttribute('data-picker-week'))
                    key(event, rowDate);
                }} onpointerenter={event => { if (!prefixDisabled && event.pointerType !== 'touch') onHover?.(rowDate); }}
                onpointerleave={() => { if (!prefixDisabled) onHover?.(null); }}>
                <button type="button" data-picker-week={label(rowDate)} class={`${prefixCls}-cell-inner date-cell`}
                  aria-label={`${locale.week} ${adapter.locale.getWeek(locale.locale, rowDate)}`} disabled={prefixDisabled} tabindex="-1">{adapter.locale.getWeek(locale.locale, rowDate)}</button>
              </td>{/if}{#each cells.slice(row * width, (row + 1) * width) as date (label(date))}
            {@const disabled = unavailable(date)}
            {@const inView = datePanel ? date.month() === panel.month() : mode === 'month' || mode === 'quarter' ? true : date.year() >= Math.floor(panel.year() / (mode === 'year' ? 10 : 100)) * (mode === 'year' ? 10 : 100) && date.year() < Math.floor(panel.year() / (mode === 'year' ? 10 : 100)) * (mode === 'year' ? 10 : 100) + (mode === 'year' ? 10 : 100)}
            <td onclick={cellRender ? () => { if (!disabled) onSelect(date); } : undefined}
              onkeydown={cellRender ? event => {
                const target = event.target;
                if (target instanceof HTMLButtonElement && target.hasAttribute('data-picker-date'))
                  key(event, date);
              } : undefined}
              onpointerenter={event => {
                if (!disabled && event.pointerType !== 'touch')
                  onHover?.(date);
              }} onpointerleave={() => {
                if (!preserveDisabledHover || !disabled) onHover?.(null);
              }} aria-selected={!weekPanel && selectedCell(date)} aria-disabled={disabled || undefined} title={picker !== 'date' && mode === 'decade' ? undefined : label(date)} class={[
                  `${prefixCls}-cell`,
                  inView && `${prefixCls}-cell-in-view`,
                  disabled && `${prefixCls}-cell-disabled`,
                  sameCell(hovered, date) && `${prefixCls}-cell-hover`,
                  !weekPanel && !range && selectedCell(date) && `${prefixCls}-cell-selected`,
                  !weekPanel && sameCell(range?.[0], date) && `${prefixCls}-cell-range-start`,
                  !weekPanel && sameCell(range?.[1], date) && `${prefixCls}-cell-range-end`,
                  !weekPanel && inRangeCell(date) && `${prefixCls}-cell-in-range`,
                  datePanel && renderToday.isSame(date, 'day') && `${prefixCls}-cell-today`
                ]}>
              {#snippet originNode()}
              <button type="button" data-picker-date={label(date)} aria-label={label(date)} disabled={disabled} tabindex={(mode === 'quarter' ? samePickerQuarter(date, panel) : date.isSame(panel, unit)) ? 0 : -1} class={`${prefixCls}-cell-inner date-cell`} onclick={cellRender ? undefined : () => onSelect(date)} onkeydown={cellRender ? undefined : event => key(event, date)}>{cellText(date)}</button>
              {/snippet}
              {#if cellRender}{@render cellRender(date, cellInfo(originNode))}
              {:else}{@render originNode()}{/if}
            </td>
          {/each}</tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
