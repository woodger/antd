<script lang="ts" generics="DateType extends object">
  // Renders the date panel and enforces navigation and selection limits. The header, grid, and
  // custom cells share the same mode.
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import { tick, untrack, type Snippet } from 'svelte';
  import { createDatePickerEngine } from './date-picker.engine';
  import type {
    DatePickerCalendarMode, DatePickerPicker, DatePickerProps,
    DatePickerCellRenderInfo, DatePickerPopupSlots
  } from './date-picker.types';
  import type { PickerLocale } from './picker-locale.types';
  import type { DatePickerPanelNavigation } from './picker-components.types';
  import type { InputContent } from './input.types';
  let {
    dateOperations,
    prefixCls,
    picker = 'date',
    showWeek,
    panel,
    timeTemplate,
    selected,
    multipleValues,
    hovered,
    mode,
    controlledMode = false,
    classNames,
    styles,
    locale,
    restrictions,
    now,
    direction,
    prevIcon,
    nextIcon,
    superPrevIcon,
    superNextIcon,
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
  }: DatePickerPanelNavigation & {
    dateOperations: PickerDateOperations<DateType>;
    prefixCls: string;
    picker?: DatePickerPicker;
    showWeek?: boolean;
    panel: DateType;
    timeTemplate?: DateType;
    selected: DateType | null;
    multipleValues?: readonly DateType[];
    hovered?: DateType | null;
    mode: DatePickerCalendarMode;
    controlledMode?: boolean;
    classNames?: DatePickerPopupSlots;
    styles?: DatePickerPopupSlots;
    direction: 'ltr' | 'rtl';
    range?: readonly [DateType | null, DateType | null];
    cellRender?: DatePickerProps<DateType>['cellRender'];
    cellRange?: 'start' | 'end';
    onHover?: (value: DateType | null) => void;
    preserveDisabledHover?: boolean;
    showPrevious?: boolean;
    showNext?: boolean;
    locale: PickerLocale;
    restrictions: Pick<DatePickerProps<DateType>, 'minDate' | 'maxDate' | 'disabledDate'>;
    now: DateType;
    onSelect: (value: DateType) => void;
    onNavigate: (value: DateType) => void;
    onModeChange: (mode: DatePickerCalendarMode, viewDate?: DateType) => void;
  } = $props();
  const dates = untrack(() => dateOperations);
  const { generateConfig: adapter, fields } = dates;
  const {
    pickerCalendarValue, calendarCells, samePickerWeek, samePickerQuarter,
    pickerDateDisabled, pickerPanelDateDisabled
  } = createDatePickerEngine(dates);

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
  // rc-picker normalizes only the time portion of the calendar's pickerValue, independently of the selected value.
  let cellPanel = $derived(pickerCalendarValue(panel, timeTemplate));
  let cells = $derived.by(() => {
    void renderToday;
    return calendarCells(cellPanel, mode, locale.locale);
  });
  let datePanel = $derived(mode === 'date' || mode === 'week');
  let weekPanel = $derived(mode === 'week');
  let weekPrefix = $derived(datePanel && (showWeek ?? weekPanel));
  let width = $derived(datePanel ? 7 : mode === 'quarter' ? 4 : 3);
  let weeks = $derived(locale.shortWeekDays ?? adapter.locale.getShortWeekDays?.(locale.locale) ?? []);
  let months = $derived(locale.shortMonths ?? adapter.locale.getShortMonths?.(locale.locale) ?? []);
  let firstDay = $derived(adapter.locale.getWeekFirstDay(locale.locale));
  let unit = $derived<'day' | 'month' | 'year'>(
    datePanel ? 'day' : mode === 'month' || mode === 'quarter' ? 'month' : 'year'
  );
  function cellInfo(originNode: Snippet): DatePickerCellRenderInfo<DateType> {
    return { prefixCls, originNode, today: renderToday, type: mode, locale, range: cellRange };
  }
  function label(date: DateType) {
    const format = mode === 'quarter' ? locale.fieldQuarterFormat ?? 'YYYY-[Q]Q'
      : mode === 'month' ? locale.fieldMonthFormat ?? 'YYYY-MM'
      : mode === 'year' ? locale.fieldYearFormat ?? 'YYYY' : undefined;
    return format && (picker !== 'date' || mode === 'quarter')
      ? adapter.locale.format(locale.locale, date, format)
      : dates.formatKey(date, datePanel ? 'YYYY-MM-DD' : mode === 'month' ? 'YYYY-MM' : 'YYYY', locale.locale);
  }
  function cellText(date: DateType) {
    if (mode === 'month' && !locale.monthFormat) {
      return months[fields.getMonth(date)];
    }
    const format = mode === 'quarter' ? locale.cellQuarterFormat ?? '[Q]Q'
      : datePanel ? locale.cellDateFormat ?? 'D'
      : mode === 'month' ? locale.monthFormat! : locale.cellYearFormat ?? 'YYYY';
    const text = adapter.locale.format(locale.locale, date, format);
    return mode === 'decade'
      ? `${text}-${adapter.locale.format(locale.locale, fields.addYear(date, 9), format)}` : text;
  }
  function move(amount: number, large = false) {
    onNavigate(
      datePanel
        ? dates.add(cellPanel, amount, large ? 'year' : 'month')
        : dates.add(cellPanel,
          amount * (mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100),
          'year'
        )
    );
  }
  function selectedCell(date: DateType) {
    if (multipleValues) {
      return multipleValues.some(value => sameCell(value, date));
    }
    return selected
      ? weekPanel ? samePickerWeek(selected, date, locale.locale)
      : mode === 'quarter' ? samePickerQuarter(selected, date)
      : mode === 'decade'
        ? Math.floor(fields.getYear(selected) / 10) === Math.floor(fields.getYear(date) / 10)
        : dates.samePeriod(selected, date, unit)
      : false;
  }
  function sameCell(value: DateType | null | undefined, date: DateType) {
    return value && (picker !== 'date' && mode === 'decade'
      ? Math.floor(fields.getYear(value) / 10) === Math.floor(fields.getYear(date) / 10)
      : weekPanel ? samePickerWeek(value, date, locale.locale)
      : mode === 'quarter' ? samePickerQuarter(value, date) : dates.samePeriod(value, date, unit));
  }
  /** Marks cells in the current calendar period. Years from adjacent periods stay outside it. */
  function cellInView(date: DateType) {
    if (datePanel) {
      return fields.getMonth(date) === fields.getMonth(panel);
    }
    if (mode === 'month' || mode === 'quarter') {
      return true;
    }

    const span = mode === 'year' ? 10 : 100;
    const first = Math.floor(fields.getYear(panel) / span) * span;
    const year = fields.getYear(date);

    return year >= first && year < first + span;
  }
  function inRangeCell(date: DateType) {
    if (!range?.[0] || !range[1]) {
      return false;
    }
    return mode === 'quarter'
      ? !samePickerQuarter(date, range[0]) && !samePickerQuarter(date, range[1])
        && dates.isAfter(date, range[0]) && dates.isBefore(date, range[1])
      : dates.isAfter(date, range[0], unit) && dates.isBefore(date, range[1], unit);
  }
  function unavailable(date: DateType) {
    return picker === 'date' && !controlledMode
      ? pickerDateDisabled(date, restrictions, mode, locale.locale)
      : pickerPanelDateDisabled(date, restrictions, mode, locale.locale);
  }
  function headerDisabled(amount: number, large = false) {
    if (weekPanel || controlledMode && datePanel) {
      const target = dates.add(cellPanel, amount, large ? 'year' : 'month');
      return amount < 0
        ? !!restrictions.minDate && dates.isBefore(dates.endOf(target, 'month'), restrictions.minDate, 'day')
        : !!restrictions.maxDate && dates.isAfter(dates.startOf(target, 'month'), restrictions.maxDate, 'day');
    }
    if (picker === 'date' && !controlledMode || mode === 'date') {
      return false;
    }
    const target = dates.add(cellPanel,
      amount * (mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100),
      'year'
    );
    const size = mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100;
    const first = Math.floor(fields.getYear(target) / size) * size;
    const last = first + size - 1;
    return amount < 0
      ? !!restrictions.minDate && last < fields.getYear(restrictions.minDate)
      : !!restrictions.maxDate && first > fields.getYear(restrictions.maxDate);
  }
  function weekRowClasses(date: DateType) {
    if (!weekPanel) {
      return undefined;
    }
    const start = range?.[0] && samePickerWeek(range[0], date, locale.locale);
    const end = range?.[1] && samePickerWeek(range[1], date, locale.locale);
    return [
      `${prefixCls}-week-panel-row`,
      !range && selectedCell(date) && `${prefixCls}-week-panel-row-selected`,
      start && `${prefixCls}-week-panel-row-range-start`,
      end && `${prefixCls}-week-panel-row-range-end`,
      range?.[0] && range[1] && !start && !end
        && dates.isAfter(date, range[0]) && dates.isBefore(date, range[1]) && `${prefixCls}-week-panel-row-range-hover`,
      hovered && samePickerWeek(hovered, date, locale.locale) && `${prefixCls}-week-panel-row-hover`
    ];
  }
  async function key(event: KeyboardEvent, date: DateType) {
    let next: DateType;
    const step = mode === 'decade' ? 10 : mode === 'quarter' ? 3 : 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      next = dates.add(date,
        (event.key === 'ArrowLeft' ? -1 : 1) * (direction === 'rtl' ? -1 : 1) * step,
        unit
      );
    }
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      next = dates.add(date, (event.key === 'ArrowUp' ? -1 : 1) * width * step, unit);
    }
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      next = datePanel
        ? dates.add(date, event.key === 'PageUp' ? -1 : 1, event.shiftKey ? 'year' : 'month')
        : dates.add(date,
          (event.key === 'PageUp' ? -1 : 1) * (mode === 'month' || mode === 'quarter' ? 1 : mode === 'year' ? 10 : 100),
          'year'
        );
    }
    else if (event.key === 'Home' || event.key === 'End') {
      next = datePanel
        ? event.key === 'Home' ? dates.startOf(date, 'month') : dates.endOf(date, 'month')
        : mode === 'month' || mode === 'quarter'
          ? fields.setMonth(date, event.key === 'Home' ? 0 : mode === 'quarter' ? 9 : 11)
          : fields.setYear(date,
            Math.floor(fields.getYear(date) / (mode === 'year'
              ? 10
              : 100)) * (mode === 'year'
                ? 10
                : 100) + (event.key === 'Home'
                  ? 0
                  : mode === 'year' ? 9 : 90)
          );
    }
    else {
      return;
    }
    event.preventDefault();
    const sign = dates.isBefore(next, date) ? -1 : 1;
    for (let n = 0; n < 3660 && unavailable(next); n++) {
      if (sign > 0
        && restrictions.maxDate
        && !(weekPanel && samePickerWeek(next, restrictions.maxDate, locale.locale))
        && dates.isAfter(dates.startOf(next, unit), dates.endOf(restrictions.maxDate, unit))
        || sign < 0
        && restrictions.minDate
        && !(weekPanel && samePickerWeek(next, restrictions.minDate, locale.locale))
        && dates.isBefore(dates.endOf(next, unit), dates.startOf(restrictions.minDate, unit))) {
        return;
      }
      next = dates.add(next, sign * step, unit);
    }
    if (unavailable(next)) {
      return;
    }
    const previous = event.target instanceof HTMLElement ? event.target : undefined;
    // Changing the month moves days between keyed rows. Keep focus inside the popup.
    root.closest<HTMLElement>(`.${prefixCls}-panel`)?.focus({ preventScroll: true });
    onNavigate(next);
    await tick();
    (root?.querySelector<HTMLButtonElement>(`[data-picker-date="${label(next)}"]`)
      ?? (previous?.isConnected && root?.contains(previous) ? previous : undefined))?.focus();
  }
</script>
<style>
  .date-cell {
    color:inherit;
    border:0;
    background:transparent;
    padding:0;
    font:inherit;
    cursor:pointer;
  }
  .date-cell:focus-visible {
    outline:2px solid var(--ant-color-primary);
    outline-offset:-2px;
  }
</style>
{#snippet navigationIcon(icon: InputContent | undefined, part: string)}
  {#if icon === undefined}<span class={`${prefixCls}-${part}-icon`}></span>
  {:else if typeof icon === 'function'}{@render icon()}
  {:else if typeof icon !== 'boolean'}{icon ?? ''}{/if}
{/snippet}
<div bind:this={root} class={[`${prefixCls}-${mode}-panel`, datePanel && showWeek && `${prefixCls}-${mode}-panel-show-week`]}>
  <div class={[`${prefixCls}-header`, classNames?.header]} style={styles?.header}>
    <button type="button" tabindex="-1" class={[`${prefixCls}-header-super-prev-btn`, headerDisabled(-1, true) && `${prefixCls}-header-super-prev-btn-disabled`]} disabled={headerDisabled(-1, true)} style:visibility={showPrevious ? undefined : 'hidden'} aria-label={locale.previousYear} onclick={() => move(-1, true)}>{@render navigationIcon(superPrevIcon, 'super-prev')}</button>
    {#if datePanel}<button type="button" tabindex="-1" class={[`${prefixCls}-header-prev-btn`, headerDisabled(-1) && `${prefixCls}-header-prev-btn-disabled`]} disabled={headerDisabled(-1)} style:visibility={showPrevious ? undefined : 'hidden'} aria-label={locale.previousMonth} onclick={() => move(-1)}>{@render navigationIcon(prevIcon, 'prev')}</button>{/if}
    <div class={`${prefixCls}-header-view`}>
      {#if datePanel}<button type="button" tabindex="-1" class={`${prefixCls}-month-btn`} aria-label={locale.monthSelect} onclick={() => onModeChange('month', cellPanel)}>{locale.monthFormat
          ? adapter.locale.format(locale.locale, panel, locale.monthFormat) : months[fields.getMonth(panel)]}</button>{/if}{#if (picker !== 'date' || controlledMode) && mode === 'decade'}{adapter.locale.format(locale.locale, fields.setYear(panel, Math.floor(fields.getYear(panel) / 100) * 100), locale.yearFormat ?? 'YYYY')}-{adapter.locale.format(locale.locale, fields.setYear(panel, Math.floor(fields.getYear(panel) / 100) * 100 + 99), locale.yearFormat ?? 'YYYY')}{:else}<button type="button" tabindex="-1" class={`${prefixCls}-${(picker !== 'date' || controlledMode) && mode === 'year' ? 'decade' : 'year'}-btn`} aria-label={mode === 'year' || mode === 'decade'
          ? locale.decadeSelect
          : locale.yearSelect} onclick={() => onModeChange(
              datePanel || mode === 'month' || mode === 'quarter' ? 'year' : 'decade', cellPanel
            )}>{mode === 'year'
            ? `${Math.floor(fields.getYear(panel) / 10) * 10}-${Math.floor(fields.getYear(panel) / 10) * 10 + 9}`
            : mode === 'decade'
              ? `${Math
                .floor(fields.getYear(panel) / 100) * 100}-${Math
                    .floor(fields.getYear(panel) / 100) * 100 + 99}`
              : adapter.locale.format(locale.locale, panel, locale.yearFormat ?? 'YYYY')}</button>{/if}
    </div>
    {#if datePanel}<button type="button" tabindex="-1" class={[`${prefixCls}-header-next-btn`, headerDisabled(1) && `${prefixCls}-header-next-btn-disabled`]} disabled={headerDisabled(1)} style:visibility={showNext ? undefined : 'hidden'} aria-label={locale.nextMonth} onclick={() => move(1)}>{@render navigationIcon(nextIcon, 'next')}</button>{/if}
    <button type="button" tabindex="-1" class={[`${prefixCls}-header-super-next-btn`, headerDisabled(1, true) && `${prefixCls}-header-super-next-btn-disabled`]} disabled={headerDisabled(1, true)} style:visibility={showNext ? undefined : 'hidden'} aria-label={locale.nextYear} onclick={() => move(1, true)}>{@render navigationIcon(superNextIcon, 'super-next')}</button>
  </div>
  <div class={[`${prefixCls}-body`, classNames?.body]} style={styles?.body}>
    <table class={[`${prefixCls}-content`, classNames?.content]} style={styles?.content}
      role="grid" aria-label={dates.formatKey(panel, 'YYYY-MM', locale.locale)}>
      {#if datePanel}<thead><tr>{#if weekPrefix}<th scope="col"><span style={'width:0;'
        + 'height:0;'
        + 'position:absolute;'
        + 'overflow:hidden;'
        + 'opacity:0'}>{locale.week}</span></th>{/if}{#each weeks as _, n}<th scope="col">{weeks[(n + firstDay) % 7]}</th>{/each}</tr></thead>{/if}
      <tbody>
        {#each Array.from({ length: cells.length / width }, (_, n) => n) as row}
          {@const rowDate = cells[row * width]}
          <tr class={weekRowClasses(rowDate)}>{#if weekPrefix}
              {@const prefixDisabled = pickerDateDisabled(rowDate, restrictions, 'week', locale.locale)}
              <td class={[`${prefixCls}-cell`, `${prefixCls}-cell-week`, prefixDisabled && `${prefixCls}-cell-disabled`]}
                aria-disabled={prefixDisabled || undefined} onclick={() => {
                  if (!prefixDisabled) onSelect(rowDate);
                }}
                onkeydown={event => {
                  if (event.target instanceof HTMLButtonElement && event.target.hasAttribute('data-picker-week'))
                    key(event, rowDate);
                }} onpointerenter={event => {
                  if (!prefixDisabled && event.pointerType !== 'touch') onHover?.(rowDate);
                }}
                onpointerleave={() => {
                  if (!prefixDisabled) onHover?.(null);
                }}>
                <button type="button" data-picker-week={label(rowDate)} class={`${prefixCls}-cell-inner date-cell`}
                  aria-label={`${locale.week} ${adapter.locale.getWeek(locale.locale, rowDate)}`} disabled={prefixDisabled} tabindex="-1">{adapter.locale.getWeek(locale.locale, rowDate)}</button>
              </td>{/if}{#each cells.slice(row * width, (row + 1) * width) as date (label(date))}
            {@const disabled = unavailable(date)}
            {@const inView = cellInView(date)}
            <td onclick={cellRender ? () => {
              if (!disabled) onSelect(date);
            } : undefined}
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
                  datePanel && dates.samePeriod(renderToday, date, 'day') && `${prefixCls}-cell-today`,
                  classNames?.item
                ]} style={styles?.item}>
              {#snippet originNode()}
              <button type="button" data-picker-date={label(date)} aria-label={label(date)} disabled={disabled} tabindex={(mode === 'quarter' ? samePickerQuarter(date, panel) : dates.samePeriod(date, panel, unit)) ? 0 : -1} class={`${prefixCls}-cell-inner date-cell`} onclick={cellRender ? undefined : () => onSelect(date)} onkeydown={cellRender ? undefined : event => key(event, date)}>{cellText(date)}</button>
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
