<script lang="ts" generics="DateType extends object">
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import { untrack } from 'svelte';
  import PickerTimeColumn from './PickerTimeColumn.svelte';
  import { createTimePickerEngine } from './time-picker.engine';
  import type { DatePickerTimeConfig } from './date-picker.types';
  import type { TimePickerProps } from './time-picker.types';
  import type { PickerLocale } from './picker-locale.types';

  let {
    dateOperations,
    prefixCls,
    value,
    pickerValue,
    config,
    locale,
    now,
    disabledTime,
    onSelect,
    onHover,
    onConfirm,
    cellRender,
    range,
    class: className,
    style,
    itemClass,
    itemStyle
  }: {
    dateOperations: PickerDateOperations<DateType>;
    prefixCls: string;
    value: DateType | null;
    pickerValue?: DateType | null;
    config: DatePickerTimeConfig<DateType> & { changeOnScroll?: boolean; };
    locale: PickerLocale;
    now: DateType;
    disabledTime?: TimePickerProps<'time', DateType>['disabledTime'];
    onSelect: (value: DateType) => void;
    onHover?: (value: DateType | null) => void;
    onConfirm?: () => void;
    cellRender?: TimePickerProps<'time', DateType>['cellRender'];
    range?: 'start' | 'end';
    class?: string;
    style?: string;
    itemClass?: string;
    itemStyle?: string;
  } = $props();

  const dates = untrack(() => dateOperations);
  const { timePickerPanel, timePickerColumnDate, timePickerColumnValue } = createTimePickerEngine(dates);
  let panel = $derived(timePickerPanel(value, pickerValue, config, disabledTime, locale, now));
</script>

<div class={`${prefixCls}-time-panel`}>
  <div class={[`${prefixCls}-content`, className]} {style}>
    {#each panel.columns as column (column.type)}
      <PickerTimeColumn {prefixCls}
        type={column.type}
        options={column.options}
        value={timePickerColumnValue(value, column.type)}
        optionalValue={timePickerColumnValue(pickerValue, column.type)}
        changeOnScroll={config.changeOnScroll}
        onChange={next => onSelect(panel.align(
          timePickerColumnDate(panel.template, value, column.type, next)
        ))}
        onHover={next => onHover?.(next === null ? null
          : timePickerColumnDate(panel.template, value, column.type, next))}
        onDblClick={onConfirm}
        {cellRender}
        {locale}
        today={now}
        {range}
        class={itemClass}
        style={itemStyle}
      />
    {/each}
  </div>
</div>
