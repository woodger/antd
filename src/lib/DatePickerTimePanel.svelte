<script module lang="ts">
  export type DatePickerTimeScrollMemory = Map<string, { signature: string; top: number }>;
</script>

<script lang="ts">
  import type { Dayjs } from 'dayjs';
  import { formatPicker, timeColumns } from './date-picker.engine';
  import { timeFormat, timePickerColumnDate, timePickerOptions } from './time-picker.engine';
  import type { DatePickerDisabledTime, DatePickerTimeConfig } from './date-picker.types';
  let { prefixCls, value, selectedValue, config, format, locale, disabledTime, onSelect, onHover,
    scrollMemory }: {
    prefixCls: string;
    value: Dayjs;
    selectedValue: Dayjs | null;
    config: DatePickerTimeConfig;
    format: string;
    locale: string;
    disabledTime?: (date: Dayjs) => DatePickerDisabledTime;
    onSelect: (value: Dayjs) => void;
    onHover?: (value: Dayjs | null) => void;
    scrollMemory?: DatePickerTimeScrollMemory;
  } = $props();
  let activeValue = $derived(selectedValue ?? value);
  let columns = $derived(timeColumns(config, format));
  let headerFormat = $derived(config.format || timeFormat({
    showHour: columns.some(column => column.unit === 'hour'),
    showMinute: columns.some(column => column.unit === 'minute'),
    showSecond: columns.some(column => column.unit === 'second'),
    showMillisecond: columns.some(column => column.unit === 'millisecond'),
    use12Hours: config.use12Hours ?? /[aA]/.test(format.replace(/\[[^\]]*\]/g, ''))
  }));
  let root: HTMLDivElement;
  const scrollValues = new WeakMap<Element, string>();
  function readColumn(column: HTMLUListElement) {
    const unit = column.getAttribute('aria-label') as
      'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem';
    const selected = selectedValue === null ? null : unit === 'meridiem'
      ? selectedValue.hour() < 12 ? 'am' : 'pm' : selectedValue.get(unit);
    // DatePicker дополняет время panel из defaultOpenValue или нулями.
    // Числовой optionalValue остаётся зависимостью и при заданном selectedValue.
    const optional = unit === 'meridiem' ? undefined : config.defaultOpenValue?.get(unit) ?? 0;
    const rows = [...column.children].map((cell, index) => {
      const button = cell.querySelector('button');
      return { node: cell as HTMLLIElement,
        value: unit === 'meridiem' ? index === 0 ? 'am' : 'pm'
          : Number(button?.getAttribute('aria-label')?.slice(unit.length + 1)),
        label: cell.textContent, disabled: button?.disabled };
    });
    const units = rows.map(row => [row.value, row.label, row.disabled].join(',')).join(';');
    return {
      signature: JSON.stringify(unit === 'meridiem' ? [selected, units]
        : [selected, optional, units]),
      target: rows.find(row => row.value === (selected ?? optional))?.node
    };
  }
  function rememberColumn(column: HTMLUListElement) {
    if (!scrollMemory || !column.isConnected || column.clientHeight === 0) return;
    const unit = column.getAttribute('aria-label')!, signature = scrollValues.get(column);
    if (signature && signature === readColumn(column).signature)
      scrollMemory.set(unit, { signature, top: column.scrollTop });
    else scrollMemory.delete(unit);
  }
  // Родитель снимает scroll до удаления popup; память не сохраняет DOM.
  export function captureScroll() {
    for (const column of root?.querySelectorAll<HTMLUListElement>('ul') ?? [])
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
    if (!view) return;
    const frame = view.requestAnimationFrame(() => {
      const units = new Set<string>();
      for (const column of host.querySelectorAll<HTMLUListElement>('ul')) {
        const unit = column.getAttribute('aria-label')!;
        units.add(unit);
        const state = scrollMemory ? readColumn(column) : undefined;
        const selected = state ? state.target : column.querySelector<HTMLLIElement>(
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
        const signature = state ? state.signature : `${selected!.textContent}:${[...column.children].map(
          cell => cell.textContent + cell.className
        ).join(
          ';'
        )}`;
        if (scrollValues.get(column) === signature)
          continue;
        const saved = scrollMemory?.get(unit);
        if (saved && (saved.signature === signature || !selected)) column.scrollTop = saved.top;
        else if (selected) column.scrollTop = selected.offsetTop - first.offsetTop;
        scrollValues.set(column, signature);
        rememberColumn(column);
      }
      for (const unit of scrollMemory?.keys() ?? [])
        if (!units.has(unit)) scrollMemory?.delete(unit);
    });
    return () => view.cancelAnimationFrame(frame);
  });
  function items(column: ReturnType<typeof timeColumns>[number]) {
    return Array.from(
      { length: Math.ceil(column.count / column.step) },
      (_, n) => n * column.step
    )
      .filter(
        item => column.unit !== 'hour' || !config.use12Hours || (item < 12) === (value.hour() < 12)
      );
  }
  function keyboard(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const target = event.currentTarget as HTMLButtonElement;
    const buttons = [
      ...target.closest('ul')!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
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
  let dynamic = $derived(disabledTime?.(value));
  let restrictions = $derived(
    {
      ...dynamic
    }
  );
  function blocked(unit: 'hour' | 'minute' | 'second' | 'millisecond', item: number) {
    if (unit === 'hour') return restrictions.disabledHours?.().includes(item) ?? false;
    if (unit === 'minute') return restrictions.disabledMinutes?.(value.hour()).includes(item)
      ?? false;
    if (unit === 'second') return restrictions
      .disabledSeconds?.(value
        .hour(), value
          .minute())
      .includes(
        item
      )
      ?? false;
    return restrictions
      .disabledMilliseconds?.(value
        .hour(), value
          .minute(), value
            .second())
      .includes(
        item
      )
      ?? false;
  }
</script>
<style>
  button { color:inherit;width:100%;border:0;background:transparent;font:inherit;text-align:inherit;padding:0;cursor:pointer; }
  button:focus-visible { outline:2px solid var(--ant-color-primary);outline-offset:-2px; }
</style>
<div bind:this={root} class={`${prefixCls}-time-panel`}>
  <div class={`${prefixCls}-header`}><div class={`${prefixCls}-header-view`}>{selectedValue
        ? formatPicker(selectedValue, locale, [headerFormat]) : '\u00a0'}</div></div>
  <div class={`${prefixCls}-content`}>
    {#each columns as column (column.unit)}
      <ul class={`${prefixCls}-time-panel-column`} aria-label={column.unit}
        onscroll={event => rememberColumn(event.currentTarget)}>
        {#each items(column) as item (item)}
          {@const unavailable = blocked(column.unit, item)}
          {#if !config.hideDisabledOptions || !unavailable}
            <li onmouseenter={onHover && (() => onHover?.(timePickerColumnDate(value, selectedValue, column.unit, item)))} onmouseleave={onHover && (() => onHover?.(null))} data-picker-time-cell-selected={selectedValue?.get(column.unit) === item || undefined} class={[
                `${prefixCls}-time-panel-cell`,
                selectedValue?.get(column.unit) === item && `${prefixCls}-time-panel-cell-selected`,
                unavailable && `${prefixCls}-time-panel-cell-disabled`
              ]}>
              <button type="button" class={`${prefixCls}-time-panel-cell-inner`} disabled={unavailable} tabindex={activeValue.get(column.unit) === item ? 0 : -1} onkeydown={keyboard} aria-label={`${column.unit} ${item}`} aria-pressed={selectedValue?.get(column.unit) === item} onclick={() => onSelect(value.set(column.unit, item))}>{String(
                  config.use12Hours && column.unit === 'hour' ? item % 12 || 12 : item
                ).padStart(
                  column.unit === 'millisecond' ? 3 : 2,
                  '0'
                )}</button>
            </li>
          {/if}
        {/each}
      </ul>
    {/each}
    {#if config.use12Hours}
      <ul class={`${prefixCls}-time-panel-column`} aria-label="meridiem"
        onscroll={event => rememberColumn(event.currentTarget)}>
        {#each [0, 12] as hour}
          {@const unavailable = timePickerOptions(24, config.hourStep, restrictions.disabledHours?.())
            .every(option => option.disabled || (option.value < 12) !== (hour === 0))}
          <li onmouseenter={onHover && (() => onHover?.(timePickerColumnDate(value, selectedValue, 'meridiem', hour === 0 ? 'am' : 'pm')))} onmouseleave={onHover && (() => onHover?.(null))} data-picker-time-cell-selected={!!selectedValue && (selectedValue.hour() < 12) === (hour === 0) || undefined} class={[
              `${prefixCls}-time-panel-cell`,
              unavailable && `${prefixCls}-time-panel-cell-disabled`,
              selectedValue && (selectedValue.hour() < 12) === (hour === 0)
                && `${prefixCls}-time-panel-cell-selected`
            ]}>
            <button type="button" class={`${prefixCls}-time-panel-cell-inner`} disabled={unavailable} tabindex={(activeValue.hour() < 12) === (hour === 0) ? 0 : -1} onkeydown={keyboard} aria-pressed={!!selectedValue && (selectedValue.hour() < 12) === (hour === 0)} onclick={() => onSelect(value.hour(value.hour() % 12 + hour))}>{hour ? 'PM' : 'AM'}</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
