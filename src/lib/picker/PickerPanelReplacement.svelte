<script lang="ts" generics="DateType extends object">
  // Gives the custom panel the same cell renderer and navigation icons.
  import type { DatePickerPanel, DatePickerPanelContext } from './picker-components.types';
  import type { DatePickerProps } from './date-picker.types';
  import type { TimePickerProps } from './time-picker.types';

  let { panel, context, dateCell, timeCell }: {
    panel: DatePickerPanel<DateType>;
    context: Omit<DatePickerPanelContext<DateType>, 'cellRender'>;
    dateCell?: DatePickerProps<DateType>['cellRender'];
    timeCell?: TimePickerProps<'time', DateType>['cellRender'];
  } = $props();
</script>

{#snippet cellRender(
  value: Parameters<DatePickerPanelContext<DateType>['cellRender']>[0],
  info: Parameters<DatePickerPanelContext<DateType>['cellRender']>[1]
)}
  {#if dateCell}
    {@render dateCell(value, info)}
  {:else if timeCell && typeof value !== 'object' && info.type === 'time' && info.subType}
    {@render timeCell(value, { ...info, type: 'time', subType: info.subType })}
  {:else}
    {@render info.originNode()}
  {/if}
{/snippet}
{#snippet prevIcon()}<span class={`${context.prefixCls}-prev-icon`}></span>{/snippet}
{#snippet nextIcon()}<span class={`${context.prefixCls}-next-icon`}></span>{/snippet}
{#snippet superPrevIcon()}<span class={`${context.prefixCls}-super-prev-icon`}></span>{/snippet}
{#snippet superNextIcon()}<span class={`${context.prefixCls}-super-next-icon`}></span>{/snippet}

{@render panel({
  ...context,
  prevIcon: context.prevIcon === undefined ? prevIcon : context.prevIcon,
  nextIcon: context.nextIcon === undefined ? nextIcon : context.nextIcon,
  superPrevIcon: context.superPrevIcon === undefined ? superPrevIcon : context.superPrevIcon,
  superNextIcon: context.superNextIcon === undefined ? superNextIcon : context.superNextIcon,
  cellRender
})}
