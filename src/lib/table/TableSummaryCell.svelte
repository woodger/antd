<script lang="ts">
  // The summary cell spans the owner's physical columns, including utility columns.
  import { useTableSummary } from './table-summary-context';
  import type { TableSummaryCellProps } from './table.types';

  let {
    index, colSpan = 1, rowSpan = 1, align, class: className, style, children, ...attributes
  }: TableSummaryCellProps = $props();

  const summary = useTableSummary();
  const prefix = $derived(summary.prefix);
  const fixed = $derived(summary.fixedSpan(index, colSpan));
  const side = $derived(fixed?.side);
  const inset = $derived(side && fixed && `inset-inline-${side}: ${fixed.offset}`);
  const cellStyle = $derived([inset, align && `text-align: ${align}`, style]
    .filter(Boolean).join('; ') || undefined);
</script>

{#if colSpan !== 0 && rowSpan !== 0}
  <td {...attributes}
    data-ant-table-part="summary-cell"
    class={[
      `${prefix}-cell`,
      side && `table-summary-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${side}`,
      className
    ]}
    colspan={colSpan === 1 ? undefined : colSpan}
    rowspan={rowSpan === 1 ? undefined : rowSpan}
    style={cellStyle}
  >{@render children?.()}</td>
{/if}
