<script lang="ts">
  import { DatePicker, RangePicker, TimePicker, TimeRangePicker,
    type DatePickerCellRenderInfo, type DatePickerMode } from '@woodger/antd-svelte';
  import type { Snippet } from 'svelte';
  import type { Dayjs } from 'dayjs';
</script>

{#snippet cell(current: Dayjs | number | 'am' | 'pm', info: DatePickerCellRenderInfo)}
  <span lang={info.locale.locale} data-prefix={info.prefixCls}
    data-range={info.range} data-unit={info.subType}>
    {@render info.originNode()}
    <small>{typeof current === 'object'
      ? current.format(info.locale.cellDateFormat ?? 'D') : current}</small>
  </span>
{/snippet}
{#snippet panel(content: Snippet)}<section>{@render content()}</section>{/snippet}
{#snippet footer(mode: DatePickerMode)}<span>{mode}</span>{/snippet}
{#snippet legacy()}<span>Legacy footer</span>{/snippet}
{#snippet timeFooter(mode: 'time')}<span>{mode}</span>{/snippet}

<DatePicker showTime cellRender={cell} panelRender={panel} renderExtraFooter={footer} />
<RangePicker showTime cellRender={cell} panelRender={panel} renderExtraFooter={legacy} />
<DatePicker renderExtraFooter={legacy} />
<TimePicker panelRender={panel} renderExtraFooter={legacy} />
<TimeRangePicker panelRender={panel} renderExtraFooter={timeFooter} />
