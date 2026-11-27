<script module lang="ts">
  export type DatePickerTimeScrollMemory = Map<string, { signature: string; top: number }>;
</script>

<script lang="ts" generics="DateType extends object">
  // Рендерит колонки времени DatePicker. Память scroll связывает позицию с
  // содержимым колонки, чтобы повторное открытие не применяло старое измерение.
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import { untrack, type Snippet } from 'svelte';
  import type { PickerLocale } from './picker-locale.types';
  import { createDatePickerEngine, timeColumns } from './date-picker.engine';
  import { createTimePickerEngine, timeFormat, timePickerOptions } from './time-picker.engine';
  import { createTimeColumnScrollSelection } from './time-picker-column.dom';
  import type { TimePickerColumnType } from './time-picker.types';
  import type { DatePickerDisabledTime, DatePickerTimeConfig, DatePickerProps,
    DatePickerCellRenderInfo, DatePickerPopupSlots } from './date-picker.types';
  let {
    dateOperations, prefixCls, value, selectedValue, config, format, locale, disabledTime,
    onSelect, onHover, scrollMemory, cellRender, cellRange, now, classNames, styles, showColumns = true
  }: {
    dateOperations: PickerDateOperations<DateType>;
    prefixCls: string;
    value: DateType;
    selectedValue: DateType | null;
    config: DatePickerTimeConfig<DateType>;
    format: string;
    locale: PickerLocale;
    now: DateType;
    cellRender?: DatePickerProps<DateType>['cellRender'];
    cellRange?: 'start' | 'end';
    disabledTime?: (date: DateType) => DatePickerDisabledTime;
    onSelect: (value: DateType) => void;
    onHover?: (value: DateType | null) => void;
    scrollMemory?: DatePickerTimeScrollMemory;
    classNames?: DatePickerPopupSlots;
    styles?: DatePickerPopupSlots;
    showColumns?: boolean;
  } = $props();
  const dates = untrack(() => dateOperations);
  const { generateConfig: adapter, fields } = dates;
  const calendar = createDatePickerEngine(dates);
  const { formatPicker } = calendar;
  const { timePickerColumnDate } = createTimePickerEngine(dates, calendar);

  let renderToday = $derived.by(() => {
    void prefixCls;
    void value;
    void selectedValue;
    void config;
    void format;
    void locale;
    void cellRender;
    void cellRange;
    void disabledTime;
    void now;
    return adapter.getNow();
  });
  function cellInfo(
    originNode: Snippet,
    subType: NonNullable<DatePickerCellRenderInfo<DateType>['subType']>
  ): DatePickerCellRenderInfo<DateType> {
    return { prefixCls, originNode, today: renderToday, type: 'time', subType,
      locale, range: cellRange };
  }
  function cellLabel(unit: ReturnType<typeof timeColumns>[number]['unit'], item: number) {
    return String(config.use12Hours && unit === 'hour' ? item % 12 || 12 : item)
      .padStart(unit === 'millisecond' ? 3 : 2, '0');
  }
  function meridiemLabel(hour: number) {
    return locale.cellMeridiemFormat
      ? adapter.locale.format(
        locale.locale,
        fields.setHour(renderToday, hour ? 15 : 9),
        locale.cellMeridiemFormat
      )
      : hour ? 'PM' : 'AM';
  }
  let activeValue = $derived(selectedValue ?? value);
  let columns = $derived(showColumns ? timeColumns(config, format) : []);
  let headerFormat = $derived(config.format || timeFormat({
    showHour: columns.some(column => column.unit === 'hour'),
    showMinute: columns.some(column => column.unit === 'minute'),
    showSecond: columns.some(column => column.unit === 'second'),
    showMillisecond: columns.some(column => column.unit === 'millisecond'),
    use12Hours: config.use12Hours ?? /[aA]/.test(format.replace(/\[[^\]]*\]/g, ''))
  }));
  let root: HTMLDivElement;
  const scrollValues = new WeakMap<Element, string>();
  const alignedPositions = new WeakMap<HTMLUListElement, number>();
  const scrollSelections = new WeakMap<
    HTMLUListElement, ReturnType<typeof createTimeColumnScrollSelection>
  >();

  /** Отложенный выбор использует текущий черновик, как нажатие на ячейку. */
  function watchColumnScroll(column: HTMLUListElement, unit: TimePickerColumnType) {
    const selection = createTimeColumnScrollSelection(
      column,
      item => item.parentElement !== column
        || item.getAttribute('data-picker-time-disabled') === 'true',
      item => {
        const selected = item.getAttribute('data-picker-time-value');
        if (selected === null) {
          return;
        }

        if (unit === 'meridiem') {
          const offset = selected === 'pm' ? 12 : 0;
          onSelect(fields.setHour(value, fields.getHour(value) % 12 + offset));
        }
        else {
          onSelect(dates.setTimeUnit(value, unit, Number(selected)));
        }
      }
    );
    scrollSelections.set(column, selection);

    return () => {
      selection.cancel();
      scrollSelections.delete(column);
    };
  }

  /** Снимает позицию, подавляя выбор при восстановлении или выравнивании. */
  function handleColumnScroll(column: HTMLUListElement) {
    rememberColumn(column);
    const selection = scrollSelections.get(column);
    if (alignedPositions.get(column) === column.scrollTop) {
      selection?.cancel();
      return;
    }

    alignedPositions.delete(column);
    selection?.schedule();
  }

  // Выбранное значение и подписи опций участвуют в ключе восстановления scroll.
  function readColumn(column: HTMLUListElement) {
    const unit = column.getAttribute('aria-label') as
      'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem';
    const selected = selectedValue === null ? null : unit === 'meridiem'
      ? fields.getHour(selectedValue) < 12 ? 'am' : 'pm' : dates.getTimeUnit(selectedValue, unit);
    // DatePicker дополняет время panel из defaultOpenValue или нулями.
    // Числовой optionalValue остаётся зависимостью и при заданном selectedValue.
    const optional = unit === 'meridiem' ? undefined
      : config.defaultOpenValue ? dates.getTimeUnit(config.defaultOpenValue, unit) : 0;
    const rows = [...column.children].map(cell => ({
      node: cell as HTMLLIElement,
      value: unit === 'meridiem' ? cell.getAttribute('data-picker-time-value')
        : Number(cell.getAttribute('data-picker-time-value')),
      label: cell.getAttribute('data-picker-time-label'),
      disabled: cell.getAttribute('data-picker-time-disabled') === 'true'
    }));
    const units = rows.map(row => [row.value, row.label, row.disabled].join(',')).join(';');
    const signatureValues = unit === 'meridiem' ? [selected, units] : [selected, optional, units];
    const signature = JSON.stringify(signatureValues);
    const targetRow = rows.find(row => row.value === (selected ?? optional));
    return { signature, target: targetRow?.node };
  }

  // Сохраняет позицию только для колонки, которую успели измерить с её текущими опциями.
  function rememberColumn(column: HTMLUListElement) {
    if (!scrollMemory || !column.isConnected || column.clientHeight === 0) {
      return;
    }
    // Правило 2: aria-label задаётся именем unit на всех ul, которые выбирает captureScroll.
    const unit = column.getAttribute('aria-label')!;
    const signature = scrollValues.get(column);
    if (signature && signature === readColumn(column).signature) {
      scrollMemory.set(unit, { signature, top: column.scrollTop });
    }
    else {
      scrollMemory.delete(unit);
    }
  }
  // Родитель снимает scroll до удаления popup; память не сохраняет DOM.
  export function captureScroll() {
    for (const column of root?.querySelectorAll<HTMLUListElement>(':scope > div > ul') ?? [])
      rememberColumn(column);
  }
  $effect(() => {
    void value;
    if (scrollMemory) {
      void selectedValue;
      void config.defaultOpenValue;
      void restrictions;
    }
    void columns;
    const host = root;
    const view = host?.ownerDocument.defaultView;
    if (!view) {
      return;
    }
    const frame = view.requestAnimationFrame(() => {
      const units = new Set<string>();
      for (const column of host.querySelectorAll<HTMLUListElement>(':scope > div > ul')) {
        const unit = column.getAttribute('aria-label')!;
        units.add(unit);
        const state = readColumn(column);
        const selected = scrollMemory || cellRender ? state.target : column.querySelector<HTMLLIElement>(
          '[data-picker-time-cell-selected]'
        ) ?? column.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.closest('li');
        const first = column.querySelector<HTMLLIElement>('li');
        if (!first) {
          if (scrollMemory) {
            scrollValues.delete(column);
            scrollMemory.delete(unit);
          }
          continue;
        }
        if (!selected && !scrollMemory) continue;
        const signature = state.signature;
        if (scrollValues.get(column) === signature)
          continue;
        scrollSelections.get(column)?.cancel();
        const saved = scrollMemory?.get(unit);
        if (saved && (saved.signature === signature || !selected)) {
          column.scrollTop = saved.top;
          alignedPositions.set(column, column.scrollTop);
        }
        else if (selected) {
          column.scrollTop = selected.offsetTop - first.offsetTop;
          alignedPositions.set(column, column.scrollTop);
        }
        scrollValues.set(column, signature);
        rememberColumn(column);
      }
      for (const unit of scrollMemory?.keys() ?? []) {
        if (!units.has(unit)) scrollMemory?.delete(unit);
      }
    });
    return () => view.cancelAnimationFrame(frame);
  });
  function items(column: ReturnType<typeof timeColumns>[number]) {
    return Array.from(
      { length: Math.ceil(column.count / column.step) },
      (_, n) => n * column.step
    )
      .filter(
        item => column.unit !== 'hour' || !config.use12Hours || (item < 12) === (fields.getHour(value) < 12)
      );
  }
  function keyboard(event: KeyboardEvent, target = event.currentTarget as HTMLButtonElement) {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const column = cellRender ? (event.currentTarget as HTMLLIElement).parentElement!
      : target.closest('ul')!;
    const buttons = [
      ...column.querySelectorAll<HTMLButtonElement>(cellRender
        ? 'button[data-picker-time-control]:not(:disabled)' : 'button:not(:disabled)')
    ];
    const index = buttons.indexOf(target);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.click();
    buttons[next]?.focus();
  }
  function cellKeyboard(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.hasAttribute('data-picker-time-control'))
      keyboard(event, target);
  }
  let dynamic = $derived(disabledTime?.(value));
  let restrictions = $derived(
    {
      ...dynamic
    }
  );
  function blocked(unit: 'hour' | 'minute' | 'second' | 'millisecond', item: number) {
    if (unit === 'hour') {
      return restrictions.disabledHours?.().includes(item) ?? false;
    }
    if (unit === 'minute') {
      return restrictions.disabledMinutes?.(fields.getHour(value)).includes(item) ?? false;
    }
    if (unit === 'second') {
      return restrictions.disabledSeconds?.(fields.getHour(value), fields.getMinute(value))
        .includes(item) ?? false;
    }

    return restrictions.disabledMilliseconds?.(
      fields.getHour(value), fields.getMinute(value), fields.getSecond(value)
    ).includes(item) ?? false;
  }
</script>
<style>
  button {
    color:inherit;
    width:100%;
    border:0;
    background:transparent;
    font:inherit;
    text-align:inherit;
    padding:0;
    cursor:pointer;
  }
  button:focus-visible {
    outline:2px solid var(--ant-color-primary);
    outline-offset:-2px;
  }
</style>
<div bind:this={root} class={`${prefixCls}-time-panel`}>
  <div class={[`${prefixCls}-header`, classNames?.header]} style={styles?.header}>
    <div class={`${prefixCls}-header-view`}>{selectedValue
        ? showColumns ? formatPicker(selectedValue, locale.locale, [headerFormat])
          : dates.formatKey(selectedValue, undefined, locale.locale)
        : '\u00a0'}</div></div>
  <div class={[`${prefixCls}-content`, classNames?.content]} style={styles?.content}>
    {#each columns as column (column.unit)}
      <ul class={`${prefixCls}-time-panel-column`} aria-label={column.unit}
        {@attach config.changeOnScroll ? node => watchColumnScroll(node, column.unit) : undefined}
        onscroll={event => handleColumnScroll(event.currentTarget)}>
        {#each items(column) as item (item)}
          {@const unavailable = blocked(column.unit, item)}
          {@const label = cellLabel(column.unit, item)}
          {#if !config.hideDisabledOptions || !unavailable}
            <li role={cellRender ? 'presentation' : undefined}
              data-picker-time-value={item} data-picker-time-label={label}
              data-picker-time-disabled={unavailable}
              onclick={cellRender ? () => {
                if (!unavailable) onSelect(dates.setTimeUnit(value, column.unit, item));
              } : undefined}
              onkeydown={cellRender ? cellKeyboard : undefined}
              onmouseenter={onHover && (() => onHover?.(timePickerColumnDate(value, selectedValue, column.unit, item)))} onmouseleave={onHover && (() => onHover?.(null))} data-picker-time-cell-selected={(selectedValue && dates.getTimeUnit(selectedValue, column.unit)) === item || undefined} class={[
                `${prefixCls}-time-panel-cell`,
                (selectedValue && dates.getTimeUnit(selectedValue, column.unit)) === item && `${prefixCls}-time-panel-cell-selected`,
                unavailable && `${prefixCls}-time-panel-cell-disabled`,
                classNames?.item
              ]} style={styles?.item}>
              {#snippet originNode()}
                <button type="button" class={`${prefixCls}-time-panel-cell-inner`}
                  data-picker-time-control={cellRender ? '' : undefined}
                  disabled={unavailable} tabindex={dates.getTimeUnit(activeValue, column.unit) === item ? 0 : -1}
                  onkeydown={cellRender ? undefined : keyboard} aria-label={`${column.unit} ${item}`}
                  aria-pressed={(selectedValue && dates.getTimeUnit(selectedValue, column.unit)) === item}
                  onclick={cellRender ? undefined : () => onSelect(dates.setTimeUnit(value, column.unit, item))}>{label}</button>
              {/snippet}
              {#if cellRender}{@render cellRender(item, cellInfo(originNode, column.unit))}
              {:else}{@render originNode()}{/if}
            </li>
          {/if}
        {/each}
      </ul>
    {/each}
    {#if showColumns && config.use12Hours}
      <ul class={`${prefixCls}-time-panel-column`} aria-label="meridiem"
        {@attach config.changeOnScroll ? node => watchColumnScroll(node, 'meridiem') : undefined}
        onscroll={event => handleColumnScroll(event.currentTarget)}>
        {#each [0, 12] as hour}
          {@const unavailable = timePickerOptions(24, config.hourStep, restrictions.disabledHours?.())
            .every(option => option.disabled || (option.value < 12) !== (hour === 0))}
          <li role={cellRender ? 'presentation' : undefined}
            data-picker-time-value={hour ? 'pm' : 'am'} data-picker-time-label={meridiemLabel(hour)}
            data-picker-time-disabled={unavailable}
            onclick={cellRender ? () => {
              if (!unavailable) onSelect(fields.setHour(value, fields.getHour(value) % 12 + hour));
            } : undefined}
            onkeydown={cellRender ? cellKeyboard : undefined}
            onmouseenter={onHover && (() => onHover?.(timePickerColumnDate(value, selectedValue, 'meridiem', hour === 0 ? 'am' : 'pm')))} onmouseleave={onHover && (() => onHover?.(null))} data-picker-time-cell-selected={!!selectedValue && (fields.getHour(selectedValue) < 12) === (hour === 0) || undefined} class={[
              `${prefixCls}-time-panel-cell`,
              unavailable && `${prefixCls}-time-panel-cell-disabled`,
              selectedValue && (fields.getHour(selectedValue) < 12) === (hour === 0)
                && `${prefixCls}-time-panel-cell-selected`,
              classNames?.item
            ]} style={styles?.item}>
            {#snippet originNode()}
              <button type="button" class={`${prefixCls}-time-panel-cell-inner`}
                data-picker-time-control={cellRender ? '' : undefined}
                disabled={unavailable} tabindex={(fields.getHour(activeValue) < 12) === (hour === 0) ? 0 : -1}
                onkeydown={cellRender ? undefined : keyboard}
                aria-pressed={!!selectedValue && (fields.getHour(selectedValue) < 12) === (hour === 0)}
                onclick={cellRender ? undefined : () => onSelect(fields.setHour(value, fields.getHour(value) % 12 + hour))}>{meridiemLabel(hour)}</button>
            {/snippet}
            {#if cellRender}{@render cellRender(hour ? 'pm' : 'am', cellInfo(originNode, 'meridiem'))}
            {:else}{@render originNode()}{/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
